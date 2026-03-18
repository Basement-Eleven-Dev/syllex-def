import { buildConversationHistory } from "../DB/messages/buildConversationHistory";
import { buildAgent } from "./buildAgent";
import {
  retrieveRelevantDocumentsWithGemini,
} from "./embeddings/retrieveRelevantDocuments";
import { connectDatabase } from "../getDatabase";
import { getGeminiClient } from "./getClient";
import { Types } from "mongoose";
import { Assistant } from "../../models/schemas/assistant.schema";

export async function generateAIResponseGemini(
  query: string,
  subjectId: Types.ObjectId,
  userId: Types.ObjectId,
) {
  try {
    const ai = await getGeminiClient(); // Il tuo client @google/genai
    await connectDatabase();

    const assistant = await Assistant.findOne({
      subjectId: subjectId,
    });

    const associatedFileIds = assistant?.associatedFileIds || [];

    // 1. RAG: Recupero dei documenti (usando la funzione Gemini che abbiamo scritto prima)
    let contextString = "";
    if (associatedFileIds.length > 0) {
      const extractSemanticContext = await retrieveRelevantDocumentsWithGemini(
        query,
        subjectId,
        associatedFileIds,
      );
      contextString = extractSemanticContext
        .map((item) => item.text)
        .join("\n\n---\n\n"); // Separatore chiaro per il modello
    }

    console.log("Contesto estratto per Gemini RAG:", contextString);

    // 2. Costruzione della memoria e del System Prompt
    const messagesHistory = await buildConversationHistory(subjectId, userId);
    const systemPrompt = await buildAgent(
      subjectId,
      contextString,
      messagesHistory,
    );

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUSER QUERY: ${query}` }],
        },
      ],
      // Se vuoi usare le System Instructions native (consigliato per coerenza)
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return (
      response.text || "Mi dispiace, non sono riuscito a generare una risposta."
    );
  } catch (error) {
    console.error("Errore nella generazione risposta Gemini:", error);
    throw error;
  }
}
