import { getOpenAIClient } from "./getClient";
import { buildConversationHistory } from "../DB/messages/buildConversationHistory";
import { buildAgent } from "./buildAgent";
import {
  retrieveRelevantDocuments,
  retrieveRelevantDocumentsWithGemini,
} from "./embeddings/retrieveRelevantDocuments";
import { getDefaultDatabase } from "../getDatabase";
import { ObjectId } from "mongodb";
import { getGeminiClient } from "./getClient";

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
    return "";
  }
  const extractSemanticContext = await retrieveRelevantDocumentsWithGemini(
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

export async function generateAIResponseGemini(
  assistantId: string,
  query: string,
  subjectId: ObjectId,
  userId: ObjectId,
) {
  try {
    const ai = await getGeminiClient(); // Il tuo client @google/genai
    const db = await getDefaultDatabase();

    const assistant = await db.collection("assistants").findOne({
      _id: new ObjectId(assistantId),
    });

    const associatedFileIds: ObjectId[] = assistant?.associatedFileIds || [];

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
      assistantId,
      contextString,
      messagesHistory,
    );

    // 3. Generazione della risposta con Gemini
    // Nota: Nel nuovo SDK, passiamo il system instruction separatamente o nel prompt
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
