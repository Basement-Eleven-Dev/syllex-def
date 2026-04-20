import { KnowledgeManualEmbedding } from "../../../models/schemas/knowledge-manual-embedding.schema";
import { connectDatabase } from "../../getDatabase";
import { getGeminiClient } from "../getClient";

interface RelevantDocument {
  text: string;
  score: number;
}

/**
 * Recupera i frammenti di manuale più rilevanti per una query utente,
 * filtrando per il ruolo dell'utente (student/teacher).
 */
export async function retrieveRelevantSyllexKnowledge(
  query: string,
  userRole: "student" | "teacher",
  documentLimit: number = 10,
): Promise<RelevantDocument[]> {
  try {
    const ai = await getGeminiClient();
    await connectDatabase();

    // 1. Arricchimento Query per focalizzare il RAG sul manuale
    const enrichedQuery = `Syllex Manual: ${query}`;

    // 2. Genera l'embedding della QUERY con Gemini
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [enrichedQuery],
      config: {
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: 768,
      },
    });

    const queryEmbedding = response.embeddings?.[0]?.values;

    if (!queryEmbedding) {
      throw new Error("Impossibile generare l'embedding per la query Gemini.");
    }

    // 3. Ricerca Vettoriale su MongoDB Atlas (collezione syllex_help_manual)
    // Filtriamo per il ruolo dell'utente: deve vedere o il suo specifico o "both"
    const relevantDocs = await KnowledgeManualEmbedding.aggregate([
      {
        $vectorSearch: {
          queryVector: queryEmbedding,
          path: "embedding",
          numCandidates: 200,
          limit: documentLimit,
          index: "syllex_help_manual_index",
          filter: {
            role: { $in: [userRole, "both"] },
          },
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

    console.log(`RAG Help Syllex: Recuperati ${relevantDocs.length} frammenti per ruolo: ${userRole}`);
    
    return relevantDocs as RelevantDocument[];
  } catch (error) {
    console.error("Errore durante la ricerca RAG nel manuale Syllex:", error);
    throw error;
  }
}
