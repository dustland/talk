"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  Share2,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/loading";
import { VoiceSelect } from "@/components/voice-select";

interface Question {
  id: number;
  question: string;
  part: 1 | 2 | 3;
  topic: string;
  sub_topic: string | null;
  follow_up_questions: string[] | null;
  cue_card_points: string[] | null;
}

function PageContent() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPart, setSelectedPart] = useState<"part1" | "part2" | "part3">(
    "part1"
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
  const [mode, setMode] = useState<"practice" | "cheat">("cheat");
  const { completion, complete } = useCompletion({
    api: "/api/completion",
  });
  const [selectedVoice, setSelectedVoice] = useState<string>("echo");
  const searchParams = useSearchParams();
  const questionId = searchParams.get("q");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const router = useRouter();

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
    const fetchQuestion = async () => {
      try {
        setIsLoadingQuestion(true);

        // Modify the URL based on whether we have a questionId
        const url = questionId
          ? `/api/questions/${questionId}`
          : `/api/questions/random?part=${selectedPart.replace("part", "")}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch question");
        }

        const data = await response.json();
        setCurrentQuestion(data);
      } catch (error) {
        console.error("Error fetching question:", error);
        toast({
          title: "Error",
          description: "Failed to fetch question. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingQuestion(false);
      }
    };

    fetchQuestion();
  }, [selectedPart, questionId]);

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
  const handleEvaluateAnswer = async () => {
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
  const handleChangeQuestion = async () => {
    const part = parseInt(selectedPart.replace("part", ""));
    setCurrentQuestion(null);
    setEvaluation(null);
    setTranscript("");
    setTimeElapsed(0);
    setIsRecording(false);

    try {
      const response = await fetch(`/api/questions/random?part=${part}`);
      if (!response.ok) throw new Error("Failed to fetch question");
      const data = await response.json();
      setCurrentQuestion(data);
      // Update URL with new question ID
      router.push(`/practice?q=${data.id}`);
    } catch (error) {
      console.error("Error fetching question:", error);
      toast({
        title: "Error",
        description: "Failed to load question. Please try again.",
        variant: "destructive",
      });
    }
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
    if (mode === "cheat" && completion) {
      setEvaluation({
        ...evaluation!,
        reference: completion,
      });
    }
  }, [completion]);

  // Function to handle streaming generation of reference answer
  const handleGenerateAnswer = async () => {
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
        feedback: "This is a reference answer generated by AI.",
        reference: "",
      });
      console.log("Generating reference answer", currentQuestion, selectedPart);
      await complete(
        `IELTS Speaking Test - Part ${currentQuestion?.part}: ${currentQuestion?.question
        }${transcript ? `\n\nPrompts: ${transcript}` : ""}`
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

  const getShareableUrl = () => {
    if (typeof window === "undefined") {
      return "";
    }
    const baseUrl = window.location.origin;
    return `${baseUrl}/?q=${currentQuestion?.id}`;
  };

  return (
    <div className="space-y-6 text-white min-h-[calc(100vh-var(--header-height))]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <IconSwitch
              Icon={Speech}
              CheckedIcon={GraduationCap}
              size="md"
              checked={mode === "cheat"}
              onCheckedChange={(checked) =>
                setMode(checked ? "cheat" : "practice")
              }
              tooltip={
                mode === "practice"
                  ? "Practice speaking and get evaluation"
                  : "Get reference answer by example"
              }
            />
            <span
              className={cn(
                mode === "practice" ? "text-purple-200" : "text-indigo-200",
                "font-bold"
              )}
            >
              {mode === "practice"
                ? "Practice Speaking"
                : "Get Reference Answer"}
            </span>
          </div>
        </div>
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-white bg-indigo-500/80 border border-indigo-400 px-3 py-1 rounded-full ml-2">
            <Timer className="h-4 w-4" />
            <span className="font-mono font-bold text-sm">
              {formatTime(timeElapsed)}
            </span>
          </div>
        </CardTitle>
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
                    className="text-xs md:text-sm bg-white/20 text-white/80 rounded-full"
                  >
                    {currentQuestion?.topic || "Loading..."}
                  </Badge>
                  {currentQuestion?.sub_topic && (
                    <Badge
                      variant="secondary"
                      className="text-xs md:text-sm bg-white/20 text-white/80 rounded-full"
                    >
                      {currentQuestion.sub_topic}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleChangeQuestion}
                    variant="secondary"
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
                  <Button
                    onClick={() => setShowShareDialog(true)}
                    variant="ghost"
                    size="icon"
                    disabled={!currentQuestion}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="font-bold mb-4 md:text-lg">
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
              className={`bg-green-600 hover:bg-green-700 text-white text-base w-full md:w-auto py-4 rounded-full transition-colors duration-300`}
              disabled={isEvaluating}
              onClick={
                mode === "practice"
                  ? isRecording
                    ? handleEvaluateAnswer
                    : handleStartRecording
                  : handleGenerateAnswer
              }
            >
              {mode === "practice" &&
                (isEvaluating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Evaluating your answer...
                  </>
                ) : isRecording ? (
                  <>
                    <Square className="h-5 w-5" />
                    Submit for evaluation
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    Answer this question
                  </>
                ))}
              {mode === "cheat" && (
                <>
                  {isLoadingReference ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                  Get Reference Answer
                </>
              )}
            </Button>
          </div>

          {/* User's Answer */}
          <Card className="bg-white/10 backdrop-blur-lg text-white border-white/40 shadow-xl">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold mb-4">
                {mode === "practice"
                  ? "Transcript"
                  : "Prompts for Answer Generation"}
              </h3>
              <Textarea
                className="text-white placeholder:text-white/80"
                value={mode === "practice" ? transcript : transcript || ""}
                onChange={(e) => {
                  if (mode === "cheat") {
                    setTranscript(e.target.value);
                  }
                }}
                rows={mode === "practice" ? 6 : 2}
                placeholder={
                  mode === "practice"
                    ? "Keep speaking and the transcript will appear here..."
                    : "Type keywords or prompts for reference answer generation..."
                }
                readOnly={mode === "practice"}
              />
            </CardContent>
          </Card>

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
                <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-6">
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
                      <div className="flex align-center justify-between">
                        <span className="font-medium text-sm md:text-base line-clamp-1">
                          {criterion.name}
                        </span>
                        <span>{criterion.value.toFixed(1)}</span>
                      </div>
                      <Progress
                        value={(criterion.value / 9) * 100}
                        className={cn(
                          "h-2 bg-white/30 rounded-full [&>div]:rounded-full",
                          criterion.value < 5 && "[&>div]:bg-red-600",
                          criterion.value >= 5 &&
                          criterion.value < 6.5 &&
                          "[&>div]:bg-yellow-600",
                          criterion.value >= 6.5 && "[&>div]:bg-green-700"
                        )}
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
                        <VoiceSelect
                          value={selectedVoice}
                          onValueChange={setSelectedVoice}
                        />
                        <Button
                          variant="secondary"
                          className="shrink-0"
                          onClick={() => {
                            if (isPlaying && audioRef.current) {
                              audioRef.current.pause();
                            } else if (evaluation.reference) {
                              playReferenceAnswer(evaluation.reference);
                            }
                          }}
                          disabled={!evaluation?.reference || isProcessingTTS}
                        >
                          {isProcessingTTS ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isPlaying ? (
                            <VolumeOff className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                          <span className="hidden md:block">
                            {isPlaying
                              ? "Stop"
                              : isProcessingTTS
                                ? "Generating..."
                                : "Play"}
                          </span>
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `Question: ${currentQuestion?.question}\n\n${evaluation.reference}`
                                  );
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy to clipboard</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Question</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input readOnly value={getShareableUrl()} className="select-all" />
            <Button
              type="submit"
              size="sm"
              className="px-3"
              onClick={() => {
                navigator.clipboard.writeText(getShareableUrl());
                toast({
                  title: "Question Link Copied!",
                  description:
                    "Link copied to clipboard. You can share it with your friends",
                });
                setShowShareDialog(false);
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default function PracticePage() {
  return (
    <Suspense fallback={<Loading />}>
      <PageContent />
    </Suspense>
  );
}
