"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { SpeakingPartTab } from "@/components/speaking-part-tab";

export default function HomePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPart, setSelectedPart] = useState<"part1" | "part2" | "part3">(
    "part2"
  );
  const [score, setScore] = useState(6.5);
  const [timeLeft, setTimeLeft] = useState(120);
  const [evaluation, setEvaluation] = useState<{
    fluency: number;
    lexical: number;
    grammaticalRange: number;
    pronunciation: number;
  } | null>(null);
  const [aiFeedback, setAiFeedback] = useState("");

  const questions = [
    "Describe a memorable journey you have taken",
    "Talk about a skill you would like to learn",
    "Describe a person who has had a significant influence on you",
    "Discuss a book that has made a lasting impression on you",
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  const handleStartRecording = () => {
    setIsRecording(true);
    // Add additional logic to start recording
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Add additional logic to stop recording and process the audio
    // Example: Simulate evaluation and AI feedback
    setTimeout(() => {
      setEvaluation({
        fluency: 70,
        lexical: 65,
        grammaticalRange: 60,
        pronunciation: 65,
      });
      setAiFeedback(
        "Excellent use of connecting words and natural flow in describing the journey. Your use of past tense verbs and travel-related vocabulary was very appropriate."
      );
      setScore(7.0);
    }, 2000);
  };

  const handleNewQuestion = (part: 1 | 2 | 3) => {
    // Fetch or generate a new question based on the part
    // For simplicity, we'll just reset the evaluation and feedback
    setEvaluation(null);
    setAiFeedback("");
    setTimeLeft(120);
    setIsRecording(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">
              IELTS Speaking Master
            </CardTitle>
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Badge
                variant="secondary"
                className="text-2xl px-6 py-2 bg-white text-purple-700"
              >
                Score: {score}
              </Badge>
            </motion.div>
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
              >
                Part 1: Introduction
              </TabsTrigger>
              <TabsTrigger
                value="part2"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-700"
              >
                Part 2: Long Turn
              </TabsTrigger>
              <TabsTrigger
                value="part3"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-700"
              >
                Part 3: Discussion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="part1" className="space-y-4">
              <SpeakingPartTab
                part={1}
                questions={questions}
                onNewQuestion={() => handleNewQuestion(1)}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                isRecording={isRecording}
                timeLeft={timeLeft}
                evaluation={evaluation}
                aiFeedback={aiFeedback}
              />
            </TabsContent>
            <TabsContent value="part2" className="space-y-4">
              <SpeakingPartTab
                part={2}
                questions={questions}
                onNewQuestion={() => handleNewQuestion(2)}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                isRecording={isRecording}
                timeLeft={timeLeft}
                evaluation={evaluation}
                aiFeedback={aiFeedback}
              />
            </TabsContent>
            <TabsContent value="part3" className="space-y-4">
              <SpeakingPartTab
                part={3}
                questions={questions}
                onNewQuestion={() => handleNewQuestion(3)}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                isRecording={isRecording}
                timeLeft={timeLeft}
                evaluation={evaluation}
                aiFeedback={aiFeedback}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
