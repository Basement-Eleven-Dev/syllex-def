import { HydratedDocument, InferSchemaType, model, Schema } from "mongoose";

export const topicSchema = new Schema({
    name: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true }
}, {
    timestamps: true
});

type TopicRaw = InferSchemaType<typeof topicSchema>;
export type Topic = HydratedDocument<TopicRaw>;

export const Topic = model<Topic>('Topic', topicSchema, 'topics');
