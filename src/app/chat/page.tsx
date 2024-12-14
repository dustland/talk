"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { RealtimeClient } from "@openai/realtime-api-beta";
import { ItemType } from "@openai/realtime-api-beta/dist/lib/client.js";
import { WavRecorder, WavStreamPlayer } from "@/lib/wavtools";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AudioWaveform, Mic, MicOff } from "lucide-react";
import { User2, Mic2 } from "lucide-react";
import { WaveformAnimation } from "@/components/waveform-animation";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RealtimeEvent } from "@/types/realtime";
import { VoiceSelect } from "@/components/voice-select";
import { Timer } from "@/components/timer";

const LOCAL_RELAY_SERVER_URL: string =
  process.env.NEXT_PUBLIC_LOCAL_RELAY_SERVER_URL || "";

export default function PracticePage() {
  const [items, setItems] = useState<ItemType[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<string>("ballad");
  const [audioData, setAudioData] = useState<Float32Array>();

  const instructions = `You are an IELTS speaking examiner. Your name is ${currentVoice}. Conduct a natural IELTS speaking test conversation by asking ONE question at a time and waiting for the candidate's response.

Follow the IELTS speaking test format:
Part 1: Introduction and interview
- Start with a friendly greeting and introduction
- Use get_random_question tool with part=1 to get questions about familiar topics
- Ask ONE question at a time and wait for response

Part 2: Individual long turn
- Use get_random_question tool with part=2 to get ONE cue card topic
- Give candidate 1 minute to prepare and 2 minutes to speak
- Wait for the complete response

Part 3: Two-way discussion
- Use get_random_question tool with part=3 to get follow-up questions related to Part 2
- Ask ONE question at a time and wait for response

Evaluate the candidate's and provide feedback in well-structured markdown format:
- Fluency and coherence
- Lexical resource
- Grammatical range and accuracy
- Pronunciation

Important:
- Always use get_random_question tool to fetch official questions for each part
- Ask only ONE question at a time
- Wait for the candidate's response before asking the next question
- Provide brief feedback only after completing each part
- Start with a friendly greeting and introduction before Part 1

At the end of the test, provide a detailed assessment report in markdown format including:
1. Overall band score (0-9)
2. Individual scores for each criterion (0-9):
   - Fluency and Coherence
   - Lexical Resource
   - Grammatical Range and Accuracy
   - Pronunciation
3. Detailed feedback for each criterion, including:
   - Strengths
   - Areas for improvement
   - Specific examples from the candidate's responses
4. Recommendations for improvement`;

  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );

  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowAPIKeyInBrowser: true,
    })
  );
  // TODO: Replace with relay server for security reasons

  const disconnectSession = useCallback(async () => {
    setIsConnected(false);

    const client = clientRef.current;
    client.disconnect();
    // client.reset();

    const wavRecorder = wavRecorderRef.current;
    if (wavRecorder.recording) {
      await wavRecorder.end();
    }

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();
  }, []);
  const connectSession = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = new WavStreamPlayer({
      sampleRate: 24000,
    });

    setItems([]);

    try {
      await wavRecorder.begin();
      await wavStreamPlayer.connect();
      await client.connect();

      client.updateSession(
        {
          voice: currentVoice as any,
          instructions,
          temperature: 0.6,
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: { type: "server_vad", silence_duration_ms: 3000 },
        },
        "openai"
      );

      client.sendUserMessageContent([
        {
          type: "input_text",
          text: "Hello. I'm ready to start the test.",
        },
      ]);

      setIsConnected(true);

      // Add error handling for audio streaming
      await wavRecorder.record((data) => {
        try {
          if (client.isConnected()) {
            // Add method to check connection status
            client.appendInputAudio(data.mono);
          } else {
            console.log("Client disconnected, stopping audio stream");
            wavRecorder.end();
            setIsConnected(false);
          }
        } catch (error: any) {
          console.error("Error sending audio data:", error);
          // Optionally disconnect if there's a critical error
          if (error.message.includes("connection closed")) {
            disconnectSession();
          }
        }
      });
    } catch (error) {
      console.error("Error in connect session:", error);
      await disconnectSession();
    }
  }, [currentVoice, disconnectSession]);

  useEffect(() => {
    const client = clientRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    client.on("conversation.updated", async ({ item, delta }: any) => {
      // console.log("Conversation updated:", item, delta);
      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      setItems(items);
    });

    client.addTool(
      {
        name: "get_random_question",
        description:
          "Retrieves a random IELTS speaking test question for a specific part (1, 2, or 3)",
        parameters: {
          type: "object",
          properties: {
            part: {
              type: "number",
              description: "The part of the IELTS speaking test (1, 2, or 3)",
              enum: [1, 2, 3],
            },
          },
          required: ["part"],
        },
      },
      async ({ part }: { part: number }) => {
        console.log("Fetching random question for part", part);
        try {
          const response = await fetch(`/api/questions/random?part=${part}`);
          if (!response.ok) {
            throw new Error("Failed to fetch random question");
          }
          const question = await response.json();
          console.log("Fetched random question", question);
          return question;
        } catch (error) {
          console.error("Error fetching random question:", error);
          throw error;
        }
      }
    );

    client.on("realtime.event", async (realtimeEvent: RealtimeEvent) => {
      if (realtimeEvent.event.type === "response.done") {
        console.log("Response done:", realtimeEvent);
        await fetch("/api/user/metrics", {
          method: "POST",
          body: JSON.stringify(realtimeEvent),
        })
          .then((response) => {
            console.log("Logged event:", response);
          })
          .catch((error: any) => {
            console.error("Error logging event:", error);
          });
      }

      client.on("conversation.interrupted", async () => {
        const trackSampleOffset = await wavStreamPlayer.interrupt();
        if (trackSampleOffset?.trackId) {
          const { trackId, offset } = trackSampleOffset;
          await client.cancelResponse(trackId, offset);
        }
      });

      // Log other event types if needed
      // if (realtimeEvent.event.type === "error") {
      //   await fetch("/api/user/metrics", {
      //     method: "POST",
      //     body: JSON.stringify(realtimeEvent),
      //   });
      // }
    });

    return () => {
      client.reset();
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  return (
    <Card className="bg-white/10 backdrop-blur-lg text-white border-white/40 shadow-xl flex flex-col w-full justify-center min-h-[calc(100vh-6rem)]">
      {isConnected && <Timer />}
      <CardContent className="p-4 space-y-4">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-between gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <AudioWaveform className="h-12 w-12" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <VoiceSelect
                  value={currentVoice}
                  onValueChange={setCurrentVoice}
                  disabled={isConnected}
                />
              </div>
            </div>
            <span className="text-lg md:text-lg font-bold text-white whitespace-nowrap">
              AI Examiner for IELTS Speaking
            </span>

            <div className="flex items-center justify-center">
              <span className="text-white/50 text-center max-w-[80%]">
                <span className="capitalize">{currentVoice}</span> will conduct
                the test and provide a detailed assessment report. Please click
                the button to start the test.
              </span>
            </div>
          </div>
        ) : (
          <></>
        )}

        <div className="flex justify-center items-center">
          <Button
            onClick={isConnected ? disconnectSession : connectSession}
            variant={isConnected ? "destructive" : "default"}
            size="lg"
            className={cn(
              "w-48 rounded-full flex items-center justify-center p-4 transition-colors duration-500",
              isConnected
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-600 hover:bg-green-700"
            )}
          >
            {isConnected ? (
              <WaveformAnimation
                className="w-6 h-6 text-white"
                audioData={audioData}
              />
            ) : (
              <Mic className="w-6 h-6" />
            )}
            {isConnected ? (
              "End Conversation"
            ) : (
              <span className="capitalize">Start Test with {currentVoice}</span>
            )}
          </Button>
        </div>

        {isConnected && (
          <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${
                    item.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`p-4 rounded-lg max-w-[90%] ${
                      item.role === "assistant"
                        ? "bg-primary/20 text-white rounded-tr-lg rounded-br-lg rounded-bl-lg rounded-tl-sm"
                        : "bg-secondary/20 text-white rounded-tl-lg rounded-bl-lg rounded-br-lg rounded-tr-sm"
                    }`}
                  >
                    <div className="font-bold mb-2 flex items-center gap-2">
                      {item.role === "assistant" ? (
                        <>
                          <User2 className="h-4 w-4" />
                          <span>Examiner</span>
                        </>
                      ) : (
                        <>
                          <Mic2 className="h-4 w-4" />
                          <span>You</span>
                        </>
                      )}
                    </div>
                    <div>
                      {item.formatted.transcript || (
                        <ReactMarkdown>
                          {item.formatted.text || "(processing...)"}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
