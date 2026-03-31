import { FileEmbedding } from "../../../models/schemas/file-embedding.schema";
import { Subject } from "../../../models/schemas/subject.schema";
import { connectDatabase } from "../../getDatabase";
import { getGeminiClient } from "../getClient";
import { Types } from "mongoose";

interface RelevantDocument {
  text: string;
  score: number;
}



interface RelevantDocument {
  text: string;
  score: number;
}

export async function retrieveRelevantDocumentsWithGemini(
  query: string,
  subjectId: Types.ObjectId,
  associatedFileIds: Types.ObjectId[],
  documentLimit: number = 20,
): Promise<RelevantDocument[]> {
  try {
    const ai = await getGeminiClient();
    await connectDatabase();

    // 1. Recupera il nome della materia per arricchire la query (come in OpenAI)
    const subjectDoc = await Subject.findById(subjectId);
    const enrichedQuery = subjectDoc ? `${subjectDoc.name} ${query}` : query;

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

    let relevantDocs: any[] = [];

    // 3. Ricerca Vettoriale su MongoDB Atlas
    try {
      // TENTATIVO 1: Pre-filtering (Ottimale)
      relevantDocs = await FileEmbedding.aggregate([
        {
          $vectorSearch: {
            queryVector: queryEmbedding,
            path: "embedding",
            numCandidates: 500,
            limit: documentLimit,
            index: "documents_vector_search", // Assicurati di avere un indice dedicato o aggiornato
            filter: {
              subject: subjectId,
              referenced_file_id: {
                $in: associatedFileIds,
              },
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
      ])

      console.log("RAG Gemini: Risultati pre-filtering:", relevantDocs.length);
    } catch (vectorError: any) {
      console.warn(
        "RAG Gemini: Pre-filtering fallito, provo fallback post-filtering.",
      );

      // TENTATIVO 2: Fallback Post-filtering
      relevantDocs = await FileEmbedding
        .aggregate([
          {
            $vectorSearch: {
              queryVector: queryEmbedding,
              path: "embedding",
              numCandidates: 1000,
              limit: 200,
              index: "documents_vector_search_gemini",
            },
          },
          {
            $match: {
              subject: subjectId,
              referenced_file_id: {
                $in: associatedFileIds,
              },
            },
          },
          { $limit: documentLimit },
          {
            $project: {
              _id: 0,
              text: 1,
              score: { $meta: "vectorSearchScore" },
            },
          },
        ])
    }

    return relevantDocs as RelevantDocument[];
  } catch (error) {
    console.error("Errore durante la ricerca RAG con Gemini:", error);
    throw error;
  }
}
