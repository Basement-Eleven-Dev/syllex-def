import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import {
  generateAIResponseGemini,
} from "../../_helpers/AI/generateResponse";
import { saveMessage } from "../../_helpers/DB/messages/saveMessage";
import { Types } from "mongoose";

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
  if (!userId) {
    return {
      success: false,
      message: "User not authenticated",
    };
  }
  await saveMessage(
    subjectId,
    userId,
    "user",
    query,
    inputType || "text",
    conversationId,
  );
  const aiResponse = await generateAIResponseGemini(
    query,
    subjectId,
    userId,
  );

  if (!aiResponse) {
    return {
      success: false,
      message: "Failed to generate AI response",
    };
  }
  const insertId = await saveMessage(
    subjectId,
    userId,
    "agent",
    aiResponse,
    "text",
    conversationId,
  );
  return {
    success: true,
    aiResponse,
    _id: insertId,
  };
};

export const handler = lambdaRequest(generateResponse);
