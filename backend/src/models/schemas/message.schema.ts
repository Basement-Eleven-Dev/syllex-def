import { InferSchemaType, model, Schema } from "mongoose";

const messageSchema = new Schema({
    content: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    role: { type: String, enum: ['user', 'agent'], required: true },
    timestamp: { type: Date, required: true }
});

type Message = InferSchemaType<typeof messageSchema>;

export const Message = model<Message>('Message', messageSchema, 'messages');
