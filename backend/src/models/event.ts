import { ObjectId } from "mongodb";

export type CalendarEvent = {
  _id: ObjectId;
  title: string;
  description?: string;
  date: Date;
  time?: string; // HH:mm
  teacherId: ObjectId;
  subjectId: ObjectId;
  createdAt: Date;
};
