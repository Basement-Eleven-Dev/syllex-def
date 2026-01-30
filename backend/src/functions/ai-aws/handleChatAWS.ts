import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import {
  getRagResponse,
  getAnthropicResponse,
  getNovaResponse,
} from "../../_helpers/_ai-aws/assistant.service";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const { message, materialIds, conversationId } = JSON.parse(req.body || "{}");

  if (!message || typeof message !== "string") {
    return res
      .status(400)
      .json({ message: "Il campo 'message' è obbligatorio." });
  }
  if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
    return res
      .status(400)
      .json({ message: "È necessario fornire almeno un 'materialId'." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const conversationsCollection = db.collection("aiconversations");

    let currentConversationId = conversationId
      ? new ObjectId(conversationId)
      : null;
    let conversationHistory = [];

    if (currentConversationId) {
      const existingConversation = await conversationsCollection.findOne({
        _id: currentConversationId,
        userId: user._id,
      });
      if (existingConversation) {
        conversationHistory = existingConversation.history || [];
      }
    }

    conversationHistory.push({
      role: "user",
      text: message,
      timestamp: new Date(),
    });

    let detectedLanguage = "italian"; // Default
    try {
      const detectionSystemPrompt = `You are a language detection expert. Your only task is to identify the language of the user's text.`;
      const detectionUserPrompt = `What language is this text written in? Respond ONLY with the name of the language in English (e.g., "italian", "english", "spanish").\n\nTEXT: "${message}"`;

      const langResponse = await getNovaResponse(
        detectionSystemPrompt,
        detectionUserPrompt
      );
      console.log('Lang Response: ' + langResponse)
      // Puliamo la risposta per assicurarci che sia solo il nome della lingua
      detectedLanguage =
        langResponse.trim().toLowerCase().split(" ")[0] || "italian";
      console.log(`[HandleChatAWS] Lingua rilevata: ${detectedLanguage}`);
    } catch (langError) {
      console.error(
        "[HandleChatAWS] Errore nel rilevamento della lingua, uso il default 'italian'.",
        langError
      );
    }

    const systemPrompt = `You are a helpful and knowledgeable AI teaching assistant. Your goal is to help users understand the provided documents.

    **CRITICAL RULES:**
    1.  **KNOWLEDGE SOURCE:** Your ONLY source of information is the provided context. It is FORBIDDEN to use your general knowledge. If the answer is not in the context, you MUST state that clearly.
    2.  **LANGUAGE:** You MUST respond in **${detectedLanguage}**.
    3.  **TONE:** Your tone should be conversational, encouraging, and clear.
    4.  **FORMATTING:** Use Markdown (bolding, lists, etc.) to structure your answers and make them easy to read.
    5.  **NATURAL PHRASING:** AVOID robotic phrases like "Based on the provided context...".`;

    const aiResponseText = await getRagResponse(
      message,
      materialIds,
      systemPrompt,
      'chat'
    );

    conversationHistory.push({
      role: "ai",
      text: aiResponseText,
      timestamp: new Date(),
    });

    if (currentConversationId) {
      await conversationsCollection.updateOne(
        { _id: currentConversationId },
        {
          $set: {
            history: conversationHistory,
            updatedAt: new Date(),
          },
        }
      );
    } else {
      const newConversation = {
        userId: user._id,
        materialIds: materialIds.map((id) => new ObjectId(id)),
        aiService: "aws-anthropic",
        history: conversationHistory,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await conversationsCollection.insertOne(newConversation);
      currentConversationId = result.insertedId;
    }

    return res.status(200).json({
      response: aiResponseText,
      conversationId: currentConversationId.toString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Errore del server durante la gestione della richiesta di chat.",
      error: error.message,
    });
  }
};
