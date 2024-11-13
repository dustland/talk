"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Mic,
  PauseCircle,
  Timer,
  Volume2,
  Loader2,
  VolumeOff,
  RefreshCcw,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  question: string;
  part: 1 | 2 | 3;
  topic: string;
  sub_topic: string | null;
  follow_up_questions: string[] | null;
  cue_card_points: string[] | null;
}

export default function HomePage() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPart, setSelectedPart] = useState<"part1" | "part2" | "part3">(
    "part2"
  );
  const [timeEllapsed, setTimeEllapsed] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
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
  const [answer, setAnswer] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

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

  // Fetch initial question when part changes
  useEffect(() => {
    const part = parseInt(selectedPart.replace("part", ""));
    fetchRandomQuestion(part);
  }, [selectedPart]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => setTimeEllapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, timeEllapsed]);

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser doesn't support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        audioChunksRef.current = [];

        try {
          // Create FormData with audio blob
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.wav");

          // First, get transcription
          const transcribeResponse = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!transcribeResponse.ok) {
            throw new Error("Transcription failed");
          }

          const { text } = await transcribeResponse.json();
          setAnswer(text);
          const answer = `IELTS Speaking Test part ${selectedPart}: ${currentQuestion?.question}. \n\nAnswer: ${text}`;

          // Then, get evaluation
          const evaluateResponse = await fetch("/api/evaluate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ answer }),
          });

          if (!evaluateResponse.ok) {
            throw new Error("Evaluation failed");
          }

          const evaluationData = await evaluateResponse.json();
          setEvaluation(evaluationData);
        } catch (error) {
          console.error("Error processing audio:", error);
          toast({
            title: "Failed to process audio",
            description: `Error: ${error}`,
          });
        } finally {
          setIsProcessing(false);
          // Stop all tracks of the stream
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Failed to access microphone",
        description: "Please check permissions.",
      });
    }
  };

  const handleStopRecording = async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);

      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/wav",
      });
      audioChunksRef.current = [];

      try {
        // Create FormData with audio blob
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.wav");

        // First, get transcription
        const transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!transcribeResponse.ok) {
          throw new Error("Transcription failed");
        }

        const { text } = await transcribeResponse.json();
        setAnswer(text);
        setIsProcessing(false);

        // Then, get evaluation
        const evaluateResponse = await fetch("/api/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (!evaluateResponse.ok) {
          throw new Error("Evaluation failed");
        }

        const evaluationData = await evaluateResponse.json();
        setEvaluation(evaluationData);
      } catch (error) {
        console.error("Error processing audio:", error);
        toast({
          title: "Failed to process audio",
          description: `Error: ${error}`,
        });
      } finally {
        setIsEvaluating(false);
      }
    }
  };

  const handleNewQuestion = () => {
    const part = parseInt(selectedPart.replace("part", ""));
    setCurrentQuestion(null);
    fetchRandomQuestion(part);
    setEvaluation(null);
    setAnswer("");
    setTimeEllapsed(0);
    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const playReferenceAnswer = async (text: string) => {
    try {
      if (audioRef) {
        audioRef.pause();
        audioRef.remove();
        setAudioRef(null);
      }

      setIsPlaying(true);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        setAudioRef(null);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onplay = () => {
        setIsPlaying(true);
      };

      setAudioRef(audio);
      await audio.play();
    } catch (error) {
      console.error("Error playing reference answer:", error);
      setIsPlaying(false);
      setAudioRef(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.remove();
      }
    };
  }, [audioRef]);

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6 max-w-4xl">
      <Card className="bg-gradient-to-r from-purple-500 to-purple-900 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Image src="/talk.svg" alt="Talk Master" width={32} height={32} />
              <span className="text-lg md:text-xl">Talk Master</span>
            </CardTitle>
            <div className="flex items-center gap-2 text-white bg-purple-500 px-4 py-2 rounded-full">
              <Timer className="h-4 w-4" />
              <span className="font-semibold">{formatTime(timeEllapsed)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                className="data-[state=active]:bg-white data-[state=active]:text-purple-700"
                disabled={isRecording}
              >
                Part 1<span className="hidden md:block">: Introduction</span>
              </TabsTrigger>
              <TabsTrigger
                value="part2"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-700"
                disabled={isRecording}
              >
                Part 2<span className="hidden md:block">: Long Turn</span>
              </TabsTrigger>
              <TabsTrigger
                value="part3"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-700"
                disabled={isRecording}
              >
                Part 3<span className="hidden md:block">: Discussion</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPart} className="space-y-4">
              <div className="space-y-4">
                {/* Header with Timer */}
                <div className="flex justify-between items-center">
                  <Card className="bg-white/10 backdrop-blur-lg text-white flex-1">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-xl">
                          Topic: {currentQuestion?.topic}
                        </h3>
                        <Button
                          onClick={handleNewQuestion}
                          variant="secondary"
                          className="bg-white/20 hover:bg-white/30"
                          disabled={isLoadingQuestion}
                        >
                          {isLoadingQuestion ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 hidden md:block">
                                Loading...
                              </span>
                            </>
                          ) : (
                            <>
                              <RefreshCcw className="h-4 w-4" />
                              <span className="ml-2 hidden md:block">
                                New Question
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-lg mb-4">
                        {isLoadingQuestion ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          currentQuestion?.question
                        )}
                      </p>
                      {currentQuestion?.part === 2 &&
                        currentQuestion.cue_card_points && (
                          <div className="text-sm opacity-90">
                            You should say:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              {currentQuestion.cue_card_points.map(
                                (point, index) => (
                                  <li key={index}>{point}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      {(currentQuestion?.part === 1 ||
                        currentQuestion?.part === 3) &&
                        currentQuestion.follow_up_questions && (
                          <div className="text-sm opacity-90 mt-4">
                            Follow-up Questions:
                            <ul className="list-disc list-inside mt-2 space-y-1">
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
                </div>

                {/* Recording Controls */}
                <div className="flex items-center gap-4 justify-center">
                  <Button
                    size="lg"
                    className={`${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white`}
                    disabled={isProcessing}
                    onClick={
                      isRecording ? handleStopRecording : handleStartRecording
                    }
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : isRecording ? (
                      <>
                        <PauseCircle className="mr-2 h-5 w-5" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-5 w-5" />
                        Start Speaking
                      </>
                    )}
                  </Button>
                </div>

                {/* Speaking Transcripts and Reference Answer */}
                <Card className="bg-white/10 backdrop-blur-lg text-white">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-xl mb-4">Your Answer</h3>
                    <div className="space-y-4">
                      <p className="text-sm bg-gray-800/40 p-3 rounded">
                        {answer}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Evaluation and AI Feedback */}

                {!isRecording && evaluation && (
                  <Card className="bg-white/10 backdrop-blur-lg text-white">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-xl">Evaluation</h3>
                        <motion.div
                          initial={{ scale: 1 }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Badge
                            variant="secondary"
                            className="text-md px-4 py-2 bg-white text-purple-700"
                          >
                            {evaluation.scores.overall.toFixed(1)}
                          </Badge>
                        </motion.div>
                      </div>
                      <Separator />
                      <div className="space-y-4">
                        <p className="font-semibold">Feedback:</p>
                        <p className="text-sm">{evaluation.feedback}</p>
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
                          <div key={criterion.name} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {criterion.name}
                              </span>
                              <span>{criterion.value.toFixed(1)}</span>
                            </div>
                            <Progress
                              value={(criterion.value / 9) * 100}
                              className="h-2 bg-white/30"
                            />
                          </div>
                        ))}
                        <div>
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between">
                              <h4 className="font-semibold text-lg">
                                Reference Answer
                              </h4>
                              <Button
                                variant="secondary"
                                className="bg-white/20 hover:bg-white/30 transition-all"
                                onClick={() => {
                                  if (isPlaying && audioRef) {
                                    audioRef.pause();
                                  } else {
                                    playReferenceAnswer(evaluation.reference);
                                  }
                                }}
                                disabled={!evaluation?.reference}
                              >
                                {isPlaying ? (
                                  <VolumeOff className="h-4 w-4" />
                                ) : (
                                  <Volume2 className="h-4 w-4" />
                                )}
                                <span className="hidden md:block ml-2">
                                  {isPlaying ? "Stop Playing" : "Listen"}
                                </span>
                              </Button>
                            </div>
                            <p className=" bg-gray-800/40 p-3 rounded">
                              {evaluation.reference}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
