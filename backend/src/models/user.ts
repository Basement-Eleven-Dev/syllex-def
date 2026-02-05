import { ObjectId } from "mongodb";

export type User = {
    _id: ObjectId;
    username: string;
    firstName?: string;
    lastName?: string;
    role: "teacher" | "student" | "admin";
    organizationId?: ObjectId;
}