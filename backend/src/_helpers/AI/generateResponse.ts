import { getOpenAIClient } from "./getOpenAIClient";
import { buildConversationHistory } from "../DB/messages/buildConversationHistory";
import { buildAgent } from "./buildAgent";
import { retrieveRelevantDocuments } from "./embeddings/retrieveRelevantDocuments";

export async function generateAIResponse(
  assistantId: string,
  query: string,
  subjectId: string,
  userId: string,
) {
  const openai = await getOpenAIClient();
  const extractSemanticContext = await retrieveRelevantDocuments(
    query,
    subjectId,
    assistantId,
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
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
  });
  return response.choices[0].message.content;
}
