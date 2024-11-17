"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Copy,
  Mic,
  Square,
  Timer,
  Volume2,
  Speech,
  Loader2,
  VolumeOff,
  Notebook,
  Sparkles,
  RotateCw,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IconSwitch } from "@/components/icon-switch";
import { useCompletion } from "ai/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Question {
  id: number;
  question: string;
  part: 1 | 2 | 3;
  topic: string;
  sub_topic: string | null;
  follow_up_questions: string[] | null;
  cue_card_points: string[] | null;
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and rounded" },
  { id: "fable", name: "Fable", description: "British accent" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Energetic and bright" },
  { id: "shimmer", name: "Shimmer", description: "Clear and precise" },
];

export default function HomePage() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPart, setSelectedPart] = useState<"part1" | "part2" | "part3">(
    "part2"
  );
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [evaluation, setEvaluation] = useState<{
    scores: {
      fluency: number;
      lexical: number;
      grammar: number;
      pronunciation: number;
      overall: number;
    };
    feedback: string;
    reference: string;
  } | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isProcessingTTS, setIsProcessingTTS] = useState(false);
  const [isLoadingReference, setIsLoadingReference] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const [transcriptionInterval, setTranscriptionInterval] = useState<number>(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mode, setMode] = useState<"practice" | "learn">("practice");
  const { completion, complete } = useCompletion({
    api: "/api/completion",
  });
  const [selectedVoice, setSelectedVoice] = useState<string>("onyx");

  // Fetch a random question based on the selected part
  const fetchRandomQuestion = async (part: number) => {
    setIsLoadingQuestion(true);
    try {
      const response = await fetch(`/api/questions/random?part=${part}`);
      if (!response.ok) {
        throw new Error("Failed to fetch question");
      }
      const data = await response.json();
      setCurrentQuestion(data);
    } catch (error) {
      console.error("Error fetching question:", error);
      toast({
        title: "Error",
        description: "Failed to load question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Fetch initial question when the component mounts or selectedPart changes
  useEffect(() => {
    const part = parseInt(selectedPart.replace("part", ""));
    fetchRandomQuestion(part);
  }, [selectedPart]);

  // Update the timer when recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);

      // Set up interval for progressive transcription
      transcriptionTimerRef.current = setInterval(() => {
        if (isRecording) {
          // only transcribe automatically during recording
          transcribeAccumulatedAudio();
        }
      }, transcriptionInterval * 1000);
    } else {
      if (timerRef.current) {
        setTimeElapsed(0);
        clearInterval(timerRef.current);
      }
      if (transcriptionTimerRef.current) {
        clearInterval(transcriptionTimerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (transcriptionTimerRef.current)
        clearInterval(transcriptionTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  // Function to handle transcription of accumulated audio
  const transcribeAccumulatedAudio = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let mimeType = "audio/webm";
    let fileExtension = "webm";

    // Use audio/mp4 for iOS if supported
    if (isIOS) {
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
        fileExtension = "mp4";
      } else {
        toast({
          title: "Unsupported MIME type",
          description: "No supported MIME type found for iOS.",
          variant: "destructive",
        });
        return;
      }
    }

    // Create a Blob with the correct MIME type
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

    if (audioBlob.size > 0) {
      try {
        const formData = new FormData();
        formData.append("file", audioBlob, `audio.${fileExtension}`);

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Transcription failed: ${response.statusText}. ${errorText}`
          );
        }

        const { text } = await response.json();

        if (text && text.trim()) {
          setTranscript(text); // Use the latest transcription result
          return text;
        }
      } catch (error) {
        console.error("Error transcribing audio:", error);
        toast({
          title: "Transcription Error",
          description: "Failed to transcribe audio. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Start recording audio
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Browser Error",
        description: "Your browser doesn't support audio recording.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      let mimeType = "audio/webm";
      let fileExtension = "webm";

      // Use audio/mp4 for iOS if supported
      if (isIOS) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
          fileExtension = "mp4";
        } else {
          toast({
            title: "Unsupported MIME type",
            description: "No supported MIME type found for iOS.",
            variant: "destructive",
          });
          return;
        }
      }

      // Check if the specified MIME type is supported
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        toast({
          title: "Unsupported MIME type",
          description: `MIME type ${mimeType} is not supported in your browser.`,
          variant: "destructive",
        });
        return;
      }

      const options: MediaRecorderOptions = { mimeType };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      console.log("MediaRecorder initialized with MIME type:", mimeType);

      audioChunksRef.current = [];
      setTranscript("");
      setEvaluation(null);
      setTimeElapsed(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current = [...audioChunksRef.current, event.data];
        }
      };

      mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description:
          "Failed to access the microphone. Please check permissions.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  // Stop recording audio
  const handleStopRecording = async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      console.log("Stopping recording", mediaRecorderRef.current?.state);
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks of the media stream
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach((track) => track.stop());

      try {
        setIsEvaluating(true);
        // Transcribe any remaining audio and then evaluate the answer
        const transcript = await transcribeAccumulatedAudio();
        if (transcript) {
          await evaluateAnswer(transcript);
        }
      } catch (error) {
        console.error("Error evaluating answer:", error);
        toast({
          title: "Evaluation Error",
          description: `Failed to evaluate your answer: ${error}. Please try again.`,
          variant: "destructive",
        });
      } finally {
        setIsEvaluating(false);
      }
    } else {
      console.warn("MediaRecorder is not active or not initialized.");
    }
  };

  // Evaluate the user's answer
  const evaluateAnswer = async (userAnswer: string) => {
    const evaluateResponse = await fetch("/api/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answer: `IELTS Speaking Test part ${selectedPart.replace(
          "part",
          ""
        )}: ${currentQuestion?.question}. \n\nAnswer: ${userAnswer}`,
      }),
    });

    if (!evaluateResponse.ok) {
      throw new Error("Evaluation failed");
    }

    const evaluationData = await evaluateResponse.json();
    setEvaluation(evaluationData);
  };

  // Handle playing the reference answer
  const playReferenceAnswer = async (text: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsProcessingTTS(true);

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audio");
      }

      setIsProcessingTTS(false);
      setIsPlaying(true);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onplay = () => {
        setIsPlaying(true);
      };

      await audio.play();
    } catch (error) {
      console.error("Error playing reference answer:", error);
      setIsPlaying(false);
    } finally {
      setIsProcessingTTS(false);
    }
  };

  // Clean up audioRef when the component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle getting a new question
  const handleNewQuestion = () => {
    const part = parseInt(selectedPart.replace("part", ""));
    setCurrentQuestion(null);
    fetchRandomQuestion(part);
    setEvaluation(null);
    setTranscript("");
    setTimeElapsed(0);
    setIsRecording(false);
  };

  // Format the time elapsed
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    if (mode === "learn" && completion) {
      setEvaluation({
        ...evaluation!,
        reference: completion,
      });
    }
  }, [completion]);

  // Function to handle streaming generation of reference answer
  const generateReferenceAnswer = async () => {
    try {
      setIsLoadingReference(true);
      // Start with empty reference
      setEvaluation({
        scores: {
          fluency: 7.5,
          lexical: 7.5,
          grammar: 7.5,
          pronunciation: 7.5,
          overall: 7.5,
        },
        feedback: "This is a reference answer.",
        reference: "",
      });
      console.log("Generating reference answer", currentQuestion, selectedPart);
      await complete(
        `IELTS Speaking Test - Part ${currentQuestion?.part}: ${currentQuestion?.question}`
      );
    } catch (error) {
      console.error("Error generating reference answer:", error);
      toast({
        title: "Generation Error",
        description: "Failed to generate reference answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReference(false);
    }
  };

  const handleGenerateReferenceAnswer = async () => {
    await generateReferenceAnswer();
  };

  return (
    <div className="container mx-auto p-4 space-y-6 text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 font-semibold">
          <Image
            src="/talk.svg"
            alt="Talk"
            width={32}
            height={32}
            className="w-6 h-6 md:w-8 md:h-8"
          />
          <span className="text-lg md:text-xl hidden md:block">Talk</span>
          <div className="flex items-center gap-2 text-white bg-indigo-500 px-3 py-1 rounded-full">
            <Timer className="h-4 w-4" />
            <span className="font-mono text-sm">{formatTime(timeElapsed)}</span>
          </div>
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span>{mode === "learn" ? "Learn" : "Practice"}</span>
            <IconSwitch
              Icon={Sparkles}
              checked={mode === "practice"}
              onCheckedChange={(checked) =>
                setMode(checked ? "practice" : "learn")
              }
              tooltip={mode === "learn" ? "Get reference answer" : "Practice"}
            />
          </div>
        </div>
      </div>

      {/* Tabs for selecting the part */}
      <Tabs
        value={selectedPart}
        onValueChange={(value) =>
          setSelectedPart(value as "part1" | "part2" | "part3")
        }
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 gap-4 bg-white/20 p-1">
          <TabsTrigger
            value="part1"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-indigo-700"
            disabled={isRecording}
          >
            Part 1<span className="hidden md:block">: Introduction</span>
          </TabsTrigger>
          <TabsTrigger
            value="part2"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-indigo-700"
            disabled={isRecording}
          >
            Part 2<span className="hidden md:block">: Long Turn</span>
          </TabsTrigger>
          <TabsTrigger
            value="part3"
            className="text-white data-[state=active]:bg-white data-[state=active]:text-indigo-700"
            disabled={isRecording}
          >
            Part 3<span className="hidden md:block">: Discussion</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPart} className="space-y-4">
          {/* Question Card */}
          <Card className="bg-white/10 backdrop-blur-lg text-white flex-1 border-white/40 shadow-xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-sm bg-white/20 text-white/80 rounded-full"
                  >
                    {currentQuestion?.topic || "Loading..."}
                  </Badge>
                  {currentQuestion?.sub_topic && (
                    <Badge
                      variant="secondary"
                      className="text-sm bg-white/20 text-white/80 rounded-full"
                    >
                      {currentQuestion.sub_topic}
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={handleNewQuestion}
                  variant="secondary"
                  className=""
                  disabled={isLoadingQuestion}
                >
                  {isLoadingQuestion ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden md:block">Loading...</span>
                    </>
                  ) : (
                    <>
                      <RotateCw className="h-4 w-4" />
                      <span className="hidden md:block">Change</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="font-bold mb-4 text-lg">
                {currentQuestion?.question || "Loading question..."}
              </p>
              {/* Additional content based on the part */}
              {currentQuestion?.part === 2 &&
                currentQuestion.cue_card_points && (
                  <div className="opacity-90">
                    You should say:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      {currentQuestion.cue_card_points.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {(currentQuestion?.part === 1 || currentQuestion?.part === 3) &&
                currentQuestion.follow_up_questions && (
                  <div className="opacity-90 mt-4">
                    Follow-up Questions:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      {currentQuestion.follow_up_questions.map(
                        (question, index) => (
                          <li key={index}>{question}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <div className="flex items-center gap-2 justify-center">
            <Button
              size="lg"
              className={`${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-600 hover:bg-green-500"
              } text-white text-base w-full md:w-auto py-4`}
              disabled={isEvaluating}
              onClick={
                mode === "practice"
                  ? isRecording
                    ? handleStopRecording
                    : handleStartRecording
                  : handleGenerateReferenceAnswer
              }
            >
              {mode === "practice" &&
                (isEvaluating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Evaluating your answer...
                  </>
                ) : isRecording ? (
                  <>
                    <Square className="mr-2 h-5 w-5" />
                    Stop Speaking
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5" />
                    Start Speaking
                  </>
                ))}
              {mode === "learn" && (
                <>
                  {isLoadingReference ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  Get Reference Answer
                </>
              )}
            </Button>
          </div>

          {/* User's Answer */}
          {mode === "practice" && (
            <Card className="bg-white/10 backdrop-blur-lg text-white border-white/40 shadow-xl">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold mb-4">
                  Transcript of your answer
                </h3>
                <p className="rounded min-h-24">
                  {transcript ? transcript : "Listening..."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Evaluation */}
          {mode === "practice" && evaluation && (
            <Card className="bg-purple-500/20 backdrop-blur-lg text-white border-white/40 shadow-xl">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Notebook className="h-4 w-4" />
                    <h3 className="font-semibold">Evaluation Report</h3>
                  </div>
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Badge
                      variant="secondary"
                      className="text-xl px-3 py-1 bg-white text-green-700"
                    >
                      {evaluation.scores.overall.toFixed(1)}
                    </Badge>
                  </motion.div>
                </div>
                <div className="grid grid-cols-2 w-full gap-6">
                  {[
                    {
                      name: "Fluency & Coherence",
                      value: evaluation.scores.fluency,
                    },
                    {
                      name: "Lexical Resource",
                      value: evaluation.scores.lexical,
                    },
                    {
                      name: "Grammatical Range",
                      value: evaluation.scores.grammar,
                    },
                    {
                      name: "Pronunciation",
                      value: evaluation.scores.pronunciation,
                    },
                  ].map((criterion) => (
                    <div key={criterion.name} className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{criterion.name}</span>
                        <span>{criterion.value.toFixed(1)}</span>
                      </div>
                      <Progress
                        value={(criterion.value / 9) * 100}
                        className="h-2 bg-white/30"
                      />
                    </div>
                  ))}
                </div>
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="feedback"
                  className="w-full"
                >
                  <AccordionItem
                    value="feedback"
                    className="border-none space-y-2"
                  >
                    <AccordionTrigger className="text-base">
                      Feedback
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-base font-medium text-white">
                        {evaluation.feedback}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}
          {evaluation?.reference && (
            <Card className="bg-white/10 backdrop-blur-lg text-white border-white/40 shadow-xl">
              <CardContent className="p-4 space-y-4">
                <div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Reference Answer</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className=""
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `Question: ${currentQuestion?.question}\n\n${evaluation.reference}`
                            );
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="hidden md:block">Copy</span>
                        </Button>
                        <Select
                          value={selectedVoice}
                          onValueChange={setSelectedVoice}
                        >
                          <SelectTrigger className="w-[140px] bg-white/10 border-white/20">
                            <Speech className="h-4 w-4 mr-2" />
                            <SelectValue>
                              {
                                VOICE_OPTIONS.find(
                                  (v) => v.id === selectedVoice
                                )?.name
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {VOICE_OPTIONS.map((voice) => (
                              <SelectItem key={voice.id} value={voice.id}>
                                <div className="flex flex-col">
                                  <span>{voice.name}</span>
                                  <span className="text-xs text-primary/60">
                                    {voice.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="secondary"
                          className=""
                          onClick={() => {
                            if (isPlaying && audioRef.current) {
                              audioRef.current.pause();
                            } else if (evaluation.reference) {
                              playReferenceAnswer(evaluation.reference);
                            }
                          }}
                          disabled={!evaluation?.reference}
                        >
                          {isProcessingTTS ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isPlaying ? (
                            <VolumeOff className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                          <span className="hidden md:block">
                            {isPlaying ? "Stop Playing" : "Listen"}
                          </span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-white/80">{evaluation.reference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
