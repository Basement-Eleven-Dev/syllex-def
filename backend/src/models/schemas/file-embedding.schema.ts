import { InferSchemaType, model, Schema } from "mongoose";

const fileEmbeddingSchema = new Schema({
    text: { type: String, required: true },
    referenced_file_id: { type: Schema.Types.ObjectId, required: true },
    teacher_id: { type: Schema.Types.ObjectId, required: true },
    subject: { type: Schema.Types.ObjectId, required: true },
    embedding: { type: [Number], required: true }
}, {
    timestamps: true
});

type FileEmbedding = InferSchemaType<typeof fileEmbeddingSchema>;

export const FileEmbedding = model<FileEmbedding>('FileEmbedding', fileEmbeddingSchema, 'file_embeddings');
