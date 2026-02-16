import { ObjectId } from "bson";
import { getDefaultDatabase } from "../../getDatabase";
import { getOpenAIClient } from "../getOpenAIClient";


interface RelevantDocument {
  text: string;
  score: number;
}

export async function askRAG(
  query: string,
subjectId: string
): Promise<RelevantDocument[]> {
  const openai = await getOpenAIClient();
  const db = await getDefaultDatabase();

  try {
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding;
    const ragCollection = db.collection("documents_vector_search");

    const relevantDocs = await ragCollection
      .aggregate([
        {
          $vectorSearch: {
            queryVector: queryEmbedding,
            path: "embedding",
            numCandidates: 150,
            limit: 50,
            index: "vector_index",
          },
        },
        {
          $match: {
            subject: new ObjectId(subjectId),
          },
        },
        {
          $limit: 5, // Limitiamo ai migliori 5 risultati finali
        },
        {
          $project: {
            _id: 0,
            text: 1,
            hotel_id: 1, // Aggiungo per debug
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    return relevantDocs as RelevantDocument[];
  } catch (error) {
    console.error("Errore durante la ricerca RAG:", error);
    throw error;
  }
}
