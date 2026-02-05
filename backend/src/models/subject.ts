import { ObjectId } from "mongodb"

export type Subject = {
    _id: ObjectId,
    name: string,
    teacherId: ObjectId
}