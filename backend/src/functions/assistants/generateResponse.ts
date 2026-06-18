import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { generateAIResponseGemini } from "../../_helpers/AI/generateResponse";
import { saveMessage } from "../../_helpers/DB/messages/saveMessage";
import { buildConversationHistory } from "../../_helpers/DB/messages/buildConversationHistory";

const generateResponse = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { query, inputType, conversationId } = body;
  const subjectId = context.subjectId;

  if (!subjectId || !conversationId) {
    return {
      success: false,
      message: "Subject ID and Conversation ID are required",
    };
  }

  const userId = context.user?._id;
  const userRole = context.user?.role as
    | "teacher"
    | "student"
    | "admin"
    | undefined;
  if (!userId) {
    return { success: false, message: "User not authenticated" };
  }

  // Fetch storico PRIMA di salvare il messaggio corrente: la history contiene
  // solo i turni precedenti, così il multi-turn è pulito e senza duplicati
  const messagesHistory = await buildConversationHistory(
    subjectId,
    userId,
    conversationId,
  );
  console.log(
    `[Assistant] conversationId=${conversationId} history=${messagesHistory.length} turni`,
  );

  await saveMessage(
    subjectId,
    userId,
    "user",
    query,
    inputType || "text",
    conversationId,
  );

  const language = context.language || "it";

  const aiResponse = await generateAIResponseGemini(
    query,
    subjectId,
    userRole ?? "student",
    messagesHistory,
    language,
  );

  if (!aiResponse) {
    return { success: false, message: "Failed to generate AI response" };
  }

  const insertId = await saveMessage(
    subjectId,
    userId,
    "agent",
    aiResponse,
    "text",
    conversationId,
  );

  return { success: true, aiResponse, _id: insertId };
};

export const handler = lambdaRequest(generateResponse);
