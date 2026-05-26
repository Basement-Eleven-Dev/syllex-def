import { InferSchemaType, model, Schema } from "mongoose";

const messageSchema = new Schema({
    content: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    conversationId: { type: String, required: true }, // ID per raggruppare i messaggi della stessa sessione
    audioUrl: { type: String },
    role: { type: String, enum: ['user', 'agent'], required: true },
    inputType: { type: String, enum: ['text', 'voice'], default: 'text' },
    timestamp: { type: Date, required: true },
    conversationTitle: { type: String }
});

type Message = InferSchemaType<typeof messageSchema>;

export const Message = model<Message>('Message', messageSchema, 'messages');
