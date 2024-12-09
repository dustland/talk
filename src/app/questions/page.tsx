"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/loading";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Question = {
  id: string;
  question: string;
  part: number;
  topic: string;
  sub_topic: string;
  follow_up_questions?: string[];
  cue_card_points?: string[];
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/questions");
        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const topics = Array.from(new Set(questions.map((q) => q.topic))).sort();

  const filteredQuestions = questions.filter((question) => {
    const partMatch =
      selectedPart === "all" || question.part.toString() === selectedPart;
    const topicMatch =
      selectedTopic === "all" || question.topic === selectedTopic;
    return partMatch && topicMatch;
  });

  if (isLoading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Questions</h1>
        <div className="flex gap-4">
          <Select value={selectedPart} onValueChange={setSelectedPart}>
            <SelectTrigger className="bg-card/5 backdrop-blur-sm border-white/5 text-white">
              <SelectValue placeholder="Select part" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parts</SelectItem>
              <SelectItem value="1">Part 1</SelectItem>
              <SelectItem value="2">Part 2</SelectItem>
              <SelectItem value="3">Part 3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="bg-card/5 backdrop-blur-sm border-white/5 text-white">
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuestions.map((question) => (
          <Card
            key={question.id}
            className="bg-card/5 backdrop-blur-sm border-primary/5 hover:bg-card/10 transition-colors"
          >
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Part {question.part} - {question.topic}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 mb-4">{question.question}</p>
              <Link href={`/practice?q=${question.id}`}>
                <Button variant="outline" className="w-full group">
                  Practice This Question
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
