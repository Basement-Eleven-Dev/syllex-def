import { ObjectId } from "mongodb";

export type Question = {
  _id: ObjectId;
  type: string;
  text: string;
  explanation: string;
  policy: string;
  topicId: ObjectId;
  subjectId: ObjectId;
  teacherId: ObjectId;
  image?: string;
  options?: { label: string; isCorrect: boolean }[];
};
