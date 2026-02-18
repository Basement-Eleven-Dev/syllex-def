import { ObjectId } from "mongodb";
import { Question } from "./question";

export type AttemptQuestion = {
  question: Question;
  answer: number | string | null;
};

export type Attempt = {
  _id: ObjectId;
  testId: ObjectId;
  subjectId: ObjectId;
  teacherId: ObjectId;
  studentId: ObjectId;
  status: "in-progress" | "delivered" | "reviewed";
  startedAt: Date;
  deliveredAt?: Date;
  reviewedAt?: Date;
  timeSpent: number;
  questions: AttemptQuestion[];
  score?: number | null;
  maxScore?: number | null;
  fitTestScore?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};
