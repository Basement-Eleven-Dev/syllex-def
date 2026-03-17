import { InferSchemaType, model, Schema } from "mongoose";

const assistantSchema = new Schema({
    name: { type: String, required: true },
    tone: { type: String },
    voice: { type: String },
    teacherId: { type: Schema.Types.ObjectId, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true },
    associatedFileIds: { type: [Schema.Types.ObjectId], default: [] }
}, {
    timestamps: true
});

export type Assistant = InferSchemaType<typeof assistantSchema>;

export const Assistant = model<Assistant>('Assistant', assistantSchema, 'assistants');
