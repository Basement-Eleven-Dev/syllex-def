import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { generateAIResponse } from "../../_helpers/AI/generateResponse";
import { saveMessage } from "../../_helpers/DB/messages/saveMessage";

const generateResponse = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { assistantId, query, subjectId } = body;

  const userId = context.user?._id.toString();
  console.log(assistantId, query, subjectId, "i dati ricevuti");
  if (!userId) {
    return {
      success: false,
      message: "User not authenticated",
    };
  }
  console.log(userId, "l id dell utente");
  await saveMessage(subjectId, userId, "user", query);
  const aiResponse = await generateAIResponse(
    assistantId,
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
  const insertId = await saveMessage(subjectId, userId, "agent", aiResponse);
  return {
    success: true,
    aiResponse,
    _id: insertId,
  };
};

export const handler = lambdaRequest(generateResponse);
