import { InferSchemaType, model, Schema } from "mongoose";

const knowledgeManualEmbeddingSchema = new Schema({
    text: { type: String, required: true },
    referenced_file_id: { type: Schema.Types.ObjectId, required: true },
    role: { 
        type: String, 
        enum: ["student", "teacher", "both"], 
        required: true 
    },
    embedding: { type: [Number], required: true }
}, {
    timestamps: true
});

type KnowledgeManualEmbedding = InferSchemaType<typeof knowledgeManualEmbeddingSchema>;

export const KnowledgeManualEmbedding = model<KnowledgeManualEmbedding>(
    'KnowledgeManualEmbedding', 
    knowledgeManualEmbeddingSchema, 
    'syllex_help_manual'
);
