import { ObjectId } from "mongodb";

export type MaterialInterface = {
  _id?: ObjectId;
  name: string;
  url?: string;
  extension?: string;
  isMap?: boolean;
  content?: MaterialInterface[];
  createdAt: Date;
  aiGenerated?: boolean;
  teacherId: ObjectId;
  subjectId: ObjectId;
};
