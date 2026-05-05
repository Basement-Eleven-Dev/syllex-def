import { InferSchemaType, model, Schema, Types } from "mongoose";

const knowledgeDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    extension: { type: String },
    byteSize: { type: Number },
    role: { 
      type: String, 
      enum: ["student", "teacher", "both"], 
      default: "both",
      required: true 
    },
    vectorized: { type: Boolean, default: false },
    extractedTextFileUrl: { type: String },
  },
  {
    timestamps: true,
  },
);

export type KnowledgeDocument = InferSchemaType<typeof knowledgeDocumentSchema> & { _id: Types.ObjectId };

export const KnowledgeDocument = model<KnowledgeDocument>(
  "KnowledgeDocument",
  knowledgeDocumentSchema,
  "knowledge-documents",
);
