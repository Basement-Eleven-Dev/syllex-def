import { ObjectId } from "mongodb";

export type QuestionDifficulty =
  | "elementary"
  | "easy"
  | "medium"
  | "hard"
  | "very_hard";

export type Question = {
  _id?: ObjectId;
  type: string;
  text: string;
  aiGenerated?: boolean;
  explanation: string;
  difficulty?: QuestionDifficulty;
  correctAnswer?: boolean;
  policy: string;
  topicId: ObjectId;
  subjectId: ObjectId;
  teacherId: ObjectId;
  image?: string;
  options?: { label: string; isCorrect: boolean }[];
};
