import { InferSchemaType, model, Schema } from "mongoose";

const subjectSchema = new Schema({
    name: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true }
}, {
    timestamps: true
});

type Subject = InferSchemaType<typeof subjectSchema>;

export const Subject = model<Subject>('Subject', subjectSchema, 'subjects');
