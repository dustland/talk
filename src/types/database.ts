export interface Question {
  id: number;
  question: string;
  part: 1 | 2 | 3;
  topic: string;
  sub_topic: string | null;
  follow_up_questions: string[] | null;
  cue_card_points: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  fluency: number;
  lexical: number;
  grammaticalRange: number;
  pronunciation: number;
  overall: number;
  feedback: string;
  referenceAnswer: string;
  answer: string;
}
