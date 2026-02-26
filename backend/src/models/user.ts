import { ObjectId } from "mongodb";

export type User = {
    _id: ObjectId;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role: "teacher" | "student" | "admin";
    organizationId?: ObjectId; // Legacy single-org support
    organizationIds?: ObjectId[]; // New multi-org support
}