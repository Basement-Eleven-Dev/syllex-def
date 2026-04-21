import { FileEmbedding } from "../../../models/schemas/file-embedding.schema";
import { Subject } from "../../../models/schemas/subject.schema";
import { connectDatabase } from "../../getDatabase";
import { getGeminiClient } from "../getClient";
import { Types } from "mongoose";

interface RelevantDocument {
  text: string;
  score: number;
}

export async function retrieveRelevantDocumentsWithGemini(
  query: string,
  subjectId: Types.ObjectId,
  associatedFileIds?: Types.ObjectId[],
  documentLimit: number = 20,
  type: "text" | "voice" = "text",
): Promise<RelevantDocument[]> {
  try {
    const startTime = performance.now();
    const ai = await getGeminiClient();
    await connectDatabase();

    const embedStart = performance.now();
    // 1. Genera l'embedding della QUERY con Gemini
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [query],
      config: {
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: 768,
      },
    });

    const queryEmbedding = response.embeddings?.[0]?.values;
    const embedEnd = performance.now();

    if (!queryEmbedding) {
      throw new Error("Impossibile generare l'embedding per la query Gemini.");
    }

    // 2. Costruzione dinamica del filtro per Atlas Vector Search
    const filter: any = { subject: subjectId };

    if (type === "text") {
      if (associatedFileIds && associatedFileIds.length > 0) {
        filter.referenced_file_id = { $in: associatedFileIds };
      } else {
        console.log("[RAG Gemini] Ricerca testuale senza file associati: ritorno array vuoto.");
        return [];
      }
    }

    const searchStart = performance.now();
    let relevantDocs: any[] = [];

    // 3. Ricerca Vettoriale su MongoDB Atlas
    try {
      // TENTATIVO 1: Pre-filtering (Ottimale)
      relevantDocs = await FileEmbedding.aggregate([
        {
          $vectorSearch: {
            queryVector: queryEmbedding,
            path: "embedding",
            numCandidates: 500, // Ridotto da 1000 per velocità
            limit: documentLimit,
            index: "documents_vector_search",
            filter: filter,
          },
        },
        {
          $project: {
            _id: 0,
            text: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]);
    } catch (vectorError: any) {
      console.warn(
        `[RAG Gemini] Pre-filtering fallito per ${type}, provo fallback post-filtering.`,
        vectorError.message
      );

      // TENTATIVO 2: Fallback Post-filtering
      relevantDocs = await FileEmbedding.aggregate([
        {
          $vectorSearch: {
            queryVector: queryEmbedding,
            path: "embedding",
            numCandidates: 500,
            limit: 200,
            index: "documents_vector_search_gemini",
          },
        },
        {
          $match: filter,
        },
        { $limit: documentLimit },
        {
          $project: {
            _id: 0,
            text: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]);
    }
    const searchEnd = performance.now();
    const totalTime = performance.now() - startTime;

    console.log(`[RAG Gemini] PERFORMANCE [${type}]:
      - Embedding: ${(embedEnd - embedStart).toFixed(2)}ms
      - VectorSearch: ${(searchEnd - searchStart).toFixed(2)}ms
      - Totat: ${totalTime.toFixed(2)}ms
      - Risultati: ${relevantDocs.length}`);

    if (relevantDocs.length === 0) {
      console.warn(`[RAG Gemini] ATTENZIONE: Zero documenti trovati per la query "${query.substring(0, 50)}..." [Tipo: ${type}]`);
    }

    return relevantDocs as RelevantDocument[];
  } catch (error) {
    console.error("Errore durante la ricerca RAG con Gemini:", error);
    throw error;
  }
}
