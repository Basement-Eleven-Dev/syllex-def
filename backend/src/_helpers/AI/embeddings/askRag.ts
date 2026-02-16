import { ObjectId } from "mongodb";
import { getDefaultDatabase } from "../../getDatabase";
import { getOpenAIClient } from "../getOpenAIClient";

interface RelevantDocument {
  text: string;
  score: number;
}

export async function askRAG(
  query: string,
  subjectId: string,
  assistantId: string
): Promise<RelevantDocument[]> {
  const openai = await getOpenAIClient();
  const db = await getDefaultDatabase();

  try {
    // 1. Recupera l'assistente per ottenere i file associati
    const assistant = await db.collection("assistants").findOne({
      _id: new ObjectId(assistantId)
    });

    const associatedFileIds = assistant?.associatedFileIds || [];
    
    // Se non ci sono file associati, l'agente non "sa" nulla dai documenti
    if (associatedFileIds.length === 0) {
      return [];
    }

    // Converti in ObjectId per il match
    const fileObjectIds = associatedFileIds.map((id: any) => 
        id instanceof ObjectId ? id : new ObjectId(id.$oid || id)
    );

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
            referenced_file_id: { $in: fileObjectIds }
          },
        },
        {
          $limit: 5, // Limitiamo ai migliori 5 risultati finali
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

    return relevantDocs as RelevantDocument[];
  } catch (error) {
    console.error("Errore durante la ricerca RAG:", error);
    throw error;
  }
}
