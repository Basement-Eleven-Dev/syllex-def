import { InferSchemaType, model, Schema } from "mongoose";

const topicSchema = new Schema({
    name: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true }
}, {
    timestamps: true
});

type Topic = InferSchemaType<typeof topicSchema>;

export const Topic = model<Topic>('Topic', topicSchema, 'topics');
