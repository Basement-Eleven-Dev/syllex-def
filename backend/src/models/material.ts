import { ObjectId } from "mongodb";

export type MaterialInterface = {
  id: ObjectId;
  name: string;
  url?: string;
  extension?: string;
  content?: MaterialInterface[];
  createdAt: Date;
  aiGenerated?: boolean;
  teacherId: ObjectId;
  subjectId: ObjectId;
};
