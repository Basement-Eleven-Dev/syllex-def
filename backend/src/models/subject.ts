import { ObjectId } from "mongodb";

export type Subject = {
  _id: ObjectId;
  name: string;
  teacherId: ObjectId;
  organizationId?: ObjectId; // Aggiunto per supporto multi-org
  topics?: string[];
};
