import { Collection, ObjectId } from "mongodb";
import { getOpenAIClient } from "../getOpenAIClient";
import { getDefaultDatabase } from "../../getDatabase";

export interface VectorizeDocumentParams {
  materialId: string;
  subject: string;
  teacherId: string;
  documentText: string;
}

export interface DocumentChunk {
  text: string;
  referenced_file_id: ObjectId;
  teacher_id: ObjectId;
  subject: ObjectId;
  embedding: number[];
}
export async function vectorizeDocument(
  vectorizeDocumentParams: VectorizeDocumentParams,
) {
  try {
    const openai = await getOpenAIClient();

    const db = await getDefaultDatabase();
    const { materialId, subject, teacherId, documentText } =
      vectorizeDocumentParams;
    const vector_collection: Collection<DocumentChunk> =
      db.collection("file_embeddings");

    // Skip if already vectorized
    const existingCount = await vector_collection.countDocuments({
      referenced_file_id: new ObjectId(materialId),
    });

    if (existingCount > 0) {
      console.log(
        `File ${materialId} already vectorized. Skipping OpenAI call.`,
      );
      return;
    }

    // Strategy: Fixed-size chunking with overlap
    const chunkSize = 1500; // approximately 400-500 tokens
    const overlap = 200;
    const chunks: string[] = [];

    if (documentText.length <= chunkSize) {
      chunks.push(documentText);
    } else {
      let start = 0;
      while (start < documentText.length) {
        let end = start + chunkSize;
        // Try to not cut words in the middle if possible
        if (end < documentText.length) {
          const lastSpace = documentText.lastIndexOf(" ", end);
          if (lastSpace > start + chunkSize / 2) {
            end = lastSpace;
          }
        }
        chunks.push(documentText.substring(start, end).trim());
        start = end - overlap;
        if (start < 0) start = 0;
        // Avoid infinite loop if overlap >= chunk
        if (end >= documentText.length) break;
      }
    }

    const validChunks = chunks.filter((chunk) => chunk.length > 0);
    const batchSize = 100; // OpenAI allows up to 2048, but multiple smaller batches help avoid timeouts
    const documentsWithEmbeddings: DocumentChunk[] = [];

    console.log(
      `Vectorizing document ${materialId}: ${validChunks.length} chunks to process in batches of ${batchSize}`,
    );

    for (let i = 0; i < validChunks.length; i += batchSize) {
      const batch = validChunks.slice(i, i + batchSize);

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
      });

      const batchResults = response.data.map((item, index) => ({
        text: batch[index],
        referenced_file_id: new ObjectId(materialId),
        teacher_id: new ObjectId(teacherId),
        subject: new ObjectId(subject),
        embedding: item.embedding,
      }));

      documentsWithEmbeddings.push(...batchResults);

      // Simple delay to respect RPM if needed, though batching usually solves it
      if (i + batchSize < validChunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (documentsWithEmbeddings.length > 0) {
      await vector_collection.insertMany(documentsWithEmbeddings);
      console.log(
        `Successfully stored ${documentsWithEmbeddings.length} embeddings for material ${materialId}`,
      );
    }
  } catch (error) {
    console.error("Error in vectorizeDocument:", error);
    throw error;
  }
}
