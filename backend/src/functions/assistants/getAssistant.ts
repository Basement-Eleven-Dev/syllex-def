import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";

const getAssistant = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const teacherId = context.user?._id;
  if (!teacherId) {
    throw createError(401, "Utente non autenticato");
  }

  const subjectId = context.subjectId;

  if (!subjectId) {
    throw createError(400, "subjectId è richiesto");
  }

  return {
    success: true,
    exists: true,
    assistant: {
      name: "Alex",
      tone: "friendly",
      voice: "neutral",
      subjectId,
    },
  };
};

export const handler = lambdaRequest(getAssistant);
