import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Question {
  id: number;
  question: string;
  part: 1 | 2 | 3;
  topic: string;
  sub_topic: string | null;
  follow_up_questions: string[] | null;
  cue_card_points: string[] | null;
}

interface TabContentProps {
  part: 1 | 2 | 3;
  currentQuestion: Question | null;
  isLoading: boolean;
  onFetchQuestion: (part: 1 | 2 | 3) => Promise<void>;
}

export function TabContent({
  part,
  currentQuestion,
  isLoading,
  onFetchQuestion,
}: TabContentProps) {
  return (
    <div className="space-y-4">
      {!currentQuestion || currentQuestion.part !== part ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Button onClick={() => onFetchQuestion(part)} disabled={isLoading}>
              {isLoading ? "Loading..." : `Get Random Part ${part} Question`}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Your existing question display content */}
        </div>
      )}
    </div>
  );
}
