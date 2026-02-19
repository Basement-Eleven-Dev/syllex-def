import { ObjectId } from "mongodb";

export type Topic = {
    _id?: ObjectId;
    name: string;
    subjectId: ObjectId;
};
