import { Types } from "mongoose";
import { FileEmbedding } from "../../../models/schemas/file-embedding.schema";
import { connectDatabase } from "../../getDatabase";
import { getGeminiClient } from "../getClient";

export interface VectorizeDocumentParams {
  materialId: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  documentText: string;
}

export interface DocumentChunk {
  text: string;
  referenced_file_id: Types.ObjectId;
  teacher_id: Types.ObjectId;
  subject: Types.ObjectId;
  embedding: number[];
}


export async function vectorizeDocumentWithGemini(
  vectorizeDocumentParams: VectorizeDocumentParams,
): Promise<void> {
  try {
    const ai = await getGeminiClient();
    await connectDatabase();
    const { materialId, subjectId, teacherId, documentText } =
      vectorizeDocumentParams;


    // 1. Check rapido (Idempotenza)
    const existingCount = await FileEmbedding.countDocuments({
      referenced_file_id: materialId,
    });
    if (existingCount > 0) return;

    // 2. Chunking (Logica ottimizzata per scansionabilità)
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

    // Dividiamo i chunk in array di batch
    for (let i = 0; i < validChunks.length; i += batchSize) {
      batches.push(validChunks.slice(i, i + batchSize));
    }

    console.log(
      `Vectorizing ${materialId}: ${validChunks.length} chunks in ${batches.length} batches.`,
    );

    // 3. Esecuzione Parallela Controllata
    // Usiamo Promise.all per inviare i batch contemporaneamente (occhio ai rate limit se i documenti sono enormi)
    const embeddingPromises = batches.map(async (batch) => {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: batch,
        config: {
          taskType: "RETRIEVAL_DOCUMENT", // Fondamentale per la qualità della ricerca
          outputDimensionality: 768,
        },
      });

      if (!response.embeddings) return [];

      return response.embeddings
        .map((emb, index) => {
          if (!emb.values) return null;
          return {
            text: batch[index],
            referenced_file_id: materialId,
            teacher_id: teacherId,
            subject: subjectId,
            embedding: emb.values,
          };
        })
        .filter((item): item is DocumentChunk => item !== null);
    });

    const results = await Promise.all(embeddingPromises);
    const allDocuments = results.flat();

    // 4. Inserimento Bulk unico (più veloce di molti insertMany piccoli)
    if (allDocuments.length > 0) {
      await FileEmbedding.insertMany(allDocuments);
      console.log(
        `✅ Successo: ${allDocuments.length} embeddings salvati per ${materialId}`,
      );
    }
  } catch (error) {
    console.error(
      ` Errore critico in vectorizeDocumentWithGemini per ${vectorizeDocumentParams.materialId}:`,
      error,
    );
    throw error;
  }
}
