export type AnswerType = "mcq" | "numeric" | "text";

export interface AnswerItem {
  type: AnswerType;
  value: string | number | null;
}

export interface Session {
  id: string;
  exam_type: string;
  num_questions: number;
  time_limit_seconds: number;
  marks_per_correct: number;
  negative_mark: number;
  mode: "test" | "learning";
  question_types?: string[];
  answers?: AnswerItem[];
  correct_answers?: AnswerItem[];
  status: "in_progress" | "submitted" | "completed";
  hints_used?: Record<string, number>;
  time_taken_seconds?: number;
  created_at: string;
  submitted_at?: string;
  score?: number;
  results?: {
    score: number;
    correct: number;
    wrong: number;
    not_attempted: number;
    negative_marks_total: number;
    details: any[];
  }
}
