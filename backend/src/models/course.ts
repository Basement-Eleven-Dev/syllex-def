import { ObjectId } from "mongodb"

export type Course = {
    _id: ObjectId,
    name: string,
    subjectIds: ObjectId[]
}