import { InferSchemaType, model, Schema } from "mongoose";
import { topicSchema } from "./topic.schema";

const subjectSchema = new Schema({
    name: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true }
}, {
    timestamps: true
});

export type Subject = InferSchemaType<typeof subjectSchema>;

export const Subject = model<Subject>('Subject', subjectSchema, 'subjects');



const subjectViewSchema = new Schema({
    name: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true },
    topics: { type: [topicSchema], default: [], required: true }
}, {
    timestamps: true
});
type SubjectView = InferSchemaType<typeof subjectViewSchema>;

export const SubjectView = model<SubjectView>('SubjectView', subjectViewSchema, 'SUBJECTS');
