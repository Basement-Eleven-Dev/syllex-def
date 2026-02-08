import { ObjectId } from "mongodb";

export type Communication = {
  _id: ObjectId;
  title: string;
  content: string;
  classIds: ObjectId[];
  materialIds: ObjectId[];
  teacherId: ObjectId;
  createdAt: Date;
  updatedAt?: Date;
};
