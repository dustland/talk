"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Question {
  id: number;
  question: string;
  part: 1 | 2 | 3;
  topic: string;
  sub_topic: string | null;
  follow_up_questions: string[] | null;
  cue_card_points: string[] | null;
}

interface QuestionPickerProps {
  onQuestionSelected: (questionData: Question) => void;
}

const QuestionPicker: React.FC<QuestionPickerProps> = ({
  onQuestionSelected,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<1 | 2 | 3>(1);

  const handlePickQuestion = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_random_question", {
        p_part: selectedPart,
      });

      if (error) throw error;
      if (data) {
        onQuestionSelected(data);
      }
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        {[1, 2, 3].map((part) => (
          <button
            key={part}
            onClick={() => setSelectedPart(part as 1 | 2 | 3)}
            className={`px-4 py-2 rounded-lg ${
              selectedPart === part
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Part {part}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={handlePickQuestion}
          disabled={isLoading}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 
            disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Pick Random Question"}
        </button>

        <div className="text-sm text-gray-600">
          {selectedPart === 1 && "Introduction and Interview"}
          {selectedPart === 2 && "Cue Card / Long Turn"}
          {selectedPart === 3 && "Two-way Discussion"}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        {selectedPart === 1 &&
          "Simple questions about yourself and familiar topics"}
        {selectedPart === 2 &&
          "Speak for 2 minutes about a given topic with preparation time"}
        {selectedPart === 3 &&
          "In-depth discussion of more abstract ideas related to the Part 2 topic"}
      </div>
    </div>
  );
};

export default QuestionPicker;
