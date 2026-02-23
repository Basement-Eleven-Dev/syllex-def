import { getOpenAIClient } from "./getClient";
import { buildConversationHistory } from "../DB/messages/buildConversationHistory";
import { buildAgent } from "./buildAgent";
import { retrieveRelevantDocuments } from "./embeddings/retrieveRelevantDocuments";
import { getDefaultDatabase } from "../getDatabase";
import { ObjectId } from "mongodb";

export async function generateAIResponse(
  assistantId: string,
  query: string,
  subjectId: ObjectId,
  userId: ObjectId,
) {
  const openai = await getOpenAIClient();
  const db = await getDefaultDatabase();
  const assistant = await db.collection("assistants").findOne({
    _id: new ObjectId(assistantId),
  });

  const associatedFileIds: ObjectId[] = assistant?.associatedFileIds || [];

  // Se non ci sono file associati, l'agente non "sa" nulla dai documenti
  if (associatedFileIds.length === 0) {
    return '';
  }
  const extractSemanticContext = await retrieveRelevantDocuments(
    query,
    subjectId,
    associatedFileIds,
  );
  console.log("Contesto estratto:", extractSemanticContext);
  const contextString = extractSemanticContext
    .map((item) => item.text)
    .join("\n");
  const messagesHistory = await buildConversationHistory(subjectId, userId);
  const systemPrompt = await buildAgent(
    assistantId,
    contextString,
    messagesHistory,
  );
  const response = await openai.responses.create({
    model: "gpt-4o",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
  });
  return response.output_text;
}
