import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { generateHelpResponseGemini } from "../../_helpers/AI/generateHelpResponse";

const askSyllexHelpAssistant = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { query } = body;

  if (!query) {
    throw createError.BadRequest("Query is required");
  }

  const user = context.user;
  const subjectId = context.subjectId;
  if (!user || !subjectId) {
    throw createError.Unauthorized("User or subject not found in context");
  }
};

export const handler = lambdaRequest(askSyllexHelpAssistant);
