import { ObjectId } from "mongodb";
import { getDefaultDatabase } from "../../getDatabase";
import { getOpenAIClient } from "../getOpenAIClient";

interface RelevantDocument {
  text: string;
  score: number;
}

export async function retrieveRelevantDocuments(
  query: string,
  subjectId: ObjectId,
  associatedFileIds: ObjectId[],
  documentLimit: number = 20
): Promise<RelevantDocument[]> {
  const openai = await getOpenAIClient();
  const db = await getDefaultDatabase();

  try {

    const ragCollection = db.collection("file_embeddings");

    // 2. Recupera il nome della materia per "arricchire" la ricerca
    const subjectDoc = await db
      .collection("subjects")
      .findOne({ _id: subjectId });
    const enrichedQuery = subjectDoc ? `${subjectDoc.name} ${query}` : query;

    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: enrichedQuery,
    });

    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
    let relevantDocs: any[] = [];

    try {
      // TENTATIVO 1: Pre-filtering con ObjectId (Richiede indice configurato su Atlas)
      relevantDocs = await ragCollection
        .aggregate([
          {
            $vectorSearch: {
              queryVector: queryEmbedding,
              path: "embedding",
              numCandidates: 500,
              limit: documentLimit,
              index: "documents_vector_search",
              filter: {
                subject: new ObjectId(subjectId),
                referenced_file_id: { $in: associatedFileIds },
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
        .toArray();
    } catch (vectorError: any) {
      console.warn(
        "RAG: Pre-filtering fallito. Errore:",
        vectorError.message || vectorError,
      );

      // TENTATIVO 2: Fallback Post-filtering (Compatibile con indici senza filter fields)
      relevantDocs = await ragCollection
        .aggregate([
          {
            $vectorSearch: {
              queryVector: queryEmbedding,
              path: "embedding",
              numCandidates: 1000,
              limit: 200,
              index: "documents_vector_search",
            },
          },
          {
            $match: {
              subject: new ObjectId(subjectId),
              referenced_file_id: { $in: associatedFileIds },
            },
          },
          { $limit: 10 },
          {
            $project: {
              _id: 0,
              text: 1,
              score: { $meta: "vectorSearchScore" },
            },
          },
        ])
        .toArray();
    }
    return relevantDocs as RelevantDocument[];
  } catch (error) {
    console.error("Errore durante la ricerca RAG:", error);
    throw error;
  }
}
