import { ObjectId } from "mongodb";

export type Report = {
  _id: ObjectId;
  teacherId: ObjectId;
  subjectId: ObjectId;
  comment: string;
  url?: string;
  userAgent?: string;
  status: "pending" | "resolved" | "rejected";
  createdAt: Date;
};
