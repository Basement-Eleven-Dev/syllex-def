import { ObjectId } from "mongodb";

export type ClassHasTeacher = {
  _id: ObjectId;
  classId: ObjectId;
  subjectId: ObjectId;
  teacherId: ObjectId;
};
