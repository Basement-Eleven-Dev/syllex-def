import { Types } from "mongoose";
import { KnowledgeManualEmbedding } from "../../../models/schemas/knowledge-manual-embedding.schema";
import { connectDatabase } from "../../getDatabase";
import { getGeminiClient } from "../getClient";

export interface VectorizeKnowledgeParams {
  documentId: Types.ObjectId;
  documentText: string;
  role: "student" | "teacher" | "both";
}

export interface KnowledgeChunk {
  text: string;
  referenced_file_id: Types.ObjectId;
  role: "student" | "teacher" | "both";
  embedding: number[];
}

export async function vectorizeKnowledgeManualWithGemini(
  params: VectorizeKnowledgeParams,
): Promise<void> {
  try {
    const ai = await getGeminiClient();
    await connectDatabase();
    const { documentId, documentText, role } = params;

    // 1. Idempotency Check
    const existingCount = await KnowledgeManualEmbedding.countDocuments({
      referenced_file_id: documentId,
    });
    if (existingCount > 0) {
        // Clear existing to avoid duplicates if re-vectorized
        await KnowledgeManualEmbedding.deleteMany({ referenced_file_id: documentId });
    }

    // 2. Chunking
    const chunkSize = 1500;
    const overlap = 200;
    const chunks: string[] = [];

    for (let start = 0; start < documentText.length;) {
      let end = start + chunkSize;
      if (end < documentText.length) {
        const lastSpace = documentText.lastIndexOf(" ", end);
        if (lastSpace > start + chunkSize / 2) end = lastSpace;
      }
      chunks.push(documentText.substring(start, end).trim());
      start = end - overlap;
      if (start < 0) start = 0;
      if (end >= documentText.length) break;
    }

    const validChunks = chunks.filter(Boolean);
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < validChunks.length; i += batchSize) {
      batches.push(validChunks.slice(i, i + batchSize));
    }

    console.log(
      `Vectorizing Knowledge Doc ${documentId}: ${validChunks.length} chunks in ${batches.length} batches.`,
    );

    // 3. Parallel Execution
    const embeddingPromises = batches.map(async (batch) => {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: batch,
        config: {
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: 768,
        },
      });

      if (!response.embeddings) return [];

      return response.embeddings
        .map((emb, index) => {
          if (!emb.values) return null;
          return {
            text: batch[index],
            referenced_file_id: documentId,
            role: role,
            embedding: emb.values,
          };
        })
        .filter((item): item is KnowledgeChunk => item !== null);
    });

    const results = await Promise.all(embeddingPromises);
    const allDocuments = results.flat();

    // 4. Bulk Insert
    if (allDocuments.length > 0) {
      await KnowledgeManualEmbedding.insertMany(allDocuments);
      console.log(
        `✅ Success: ${allDocuments.length} knowledge embeddings saved for ${documentId}`,
      );
    }
  } catch (error) {
    console.error(
      ` Errore critico in vectorizeKnowledgeManualWithGemini per ${params.documentId}:`,
      error,
    );
    throw error;
  }
}
