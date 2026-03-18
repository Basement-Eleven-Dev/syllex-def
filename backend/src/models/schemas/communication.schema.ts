import { InferSchemaType, model, Schema } from "mongoose";

const communicationSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    classIds: { type: [Schema.Types.ObjectId], default: [] },
    materialIds: { type: [Schema.Types.ObjectId], default: [] },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    teacherId: { type: Schema.Types.ObjectId, required: true }
}, {
    timestamps: true
});

type Communication = InferSchemaType<typeof communicationSchema>;

export const Communication = model<Communication>('Communication', communicationSchema, 'communications');
