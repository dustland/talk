import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, PauseCircle, Timer, Shuffle, Volume2 } from "lucide-react";

interface SpeakingPartTabProps {
  part: 1 | 2 | 3;
  questions: string[];
  onNewQuestion: (part: 1 | 2 | 3) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  timeLeft: number;
  evaluation: {
    fluency: number;
    lexical: number;
    grammaticalRange: number;
    pronunciation: number;
  } | null;
  aiFeedback: string;
}

export function SpeakingPartTab({
  part,
  questions,
  onNewQuestion,
  onStartRecording,
  onStopRecording,
  isRecording,
  timeLeft,
  evaluation,
  aiFeedback,
}: SpeakingPartTabProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const changeQuestion = () => {
    const nextQuestion = (currentQuestion + 1) % questions.length;
    setCurrentQuestion(nextQuestion);
    onNewQuestion(part);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white/10 backdrop-blur-lg text-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-xl">Topic:</h3>
            <Button
              onClick={changeQuestion}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              New Question
            </Button>
          </div>
          <p className="text-lg mb-4">{questions[currentQuestion]}</p>
          <div className="text-sm opacity-90">
            You should say:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>where you went</li>
              <li>why you went there</li>
              <li>what you did there</li>
              <li>and explain why this experience was memorable</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button
          size="lg"
          className={`${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } text-white`}
          onClick={isRecording ? onStopRecording : onStartRecording}
        >
          {isRecording ? (
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
        <div className="flex items-center gap-2 text-white bg-gray-700 px-4 py-2 rounded-full">
          <Timer className="h-5 w-5" />
          <span>{formatTime(timeLeft)} / 02:00</span>
        </div>
      </div>

      {evaluation && (
        <Card className="bg-white/10 backdrop-blur-lg text-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-xl mb-4">Evaluation Criteria</h3>
            <div className="space-y-4">
              {[
                { name: "Fluency & Coherence", value: evaluation.fluency },
                { name: "Lexical Resource", value: evaluation.lexical },
                {
                  name: "Grammatical Range",
                  value: evaluation.grammaticalRange,
                },
                { name: "Pronunciation", value: evaluation.pronunciation },
              ].map((criterion) => (
                <div key={criterion.name} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{criterion.name}</span>
                    <span>{criterion.value / 10}</span>
                  </div>
                  <Progress
                    value={criterion.value}
                    className="h-2 bg-white/30"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {aiFeedback && (
        <Card className="bg-white/10 backdrop-blur-lg text-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-xl mb-4">AI Feedback</h3>
            <div className="space-y-4 text-sm">
              <p>{aiFeedback}</p>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 mt-2"
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Listen to AI Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
