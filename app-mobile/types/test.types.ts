export type QuestionType = "scelta multipla" | "vero falso" | "risposta aperta";
export type MaterialType =
  | "slides"
  | "riassunto"
  | "glossario"
  | "mappe-concettuali";
export type QuestionDifficulty =
  | "elementary"
  | "easy"
  | "medium"
  | "hard"
  | "very_hard";

export interface QuestionOption {
  label: string;
  isCorrect: boolean;
}

export interface QuestionInterface {
  _id: string;
  text: string;
  type: QuestionType;
  difficulty?: QuestionDifficulty;
  options?: QuestionOption[];
  correctAnswer?: boolean;
  topicId?: string;
  topicName?: string;
  subjectId?: string;
  organizationId?: string;
}

export interface StudentTestInterface {
  _id: string;
  name: string;
  subjectName: string;
  /** Publication status of the test itself, set by the teacher */
  status: "bozza" | "pubblicato" | "archiviato";
  source?: "self-evaluation" | "teacher";
  availableFrom?: string;
  availableTo?: string;
  timeLimit?: number;
  teacherId?: string;
  subjectId?: string;
  isPasswordProtected?: boolean;
  randomizeQuestions?: boolean;
  oneShotAnswers?: boolean;
  questions?: {
    questionId: string | { $oid: string };
    points: number;
  }[];
}

export interface AttemptQuestionData {
  question: QuestionInterface;
  answer: number | string | null;
  points?: number;
  score?: number;
  teacherComment?: string;
  status?: "correct" | "wrong" | "semi-correct";
}

export interface StudentAttemptInterface {
  _id?: string;
  testId: string;
  subjectId?: string;
  teacherId?: string;
  source?: "self-evaluation" | "teacher";
  status: "in-progress" | "delivered" | "reviewed";
  startedAt: string;
  deliveredAt?: string;
  reviewedAt?: string;
  timeSpent: number;
  score?: number | null;
  maxScore?: number | null;
  questions: AttemptQuestionData[];
}

export interface SelfEvaluationPayload {
  name?: string;
  subjectId: string;
  topicIds: string[];
  questionCount: number;
  excludedTypes: string[];
  timeLimit: number | null;
}
