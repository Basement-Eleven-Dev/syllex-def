import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { generateHelpResponseGemini } from "../../_helpers/AI/generateHelpResponse";

const askSyllexHelpAssistant = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { query, history, currentPath } = body;

  if (!query) {
    throw createError.BadRequest("Query is required");
  }

  const user = context.user;
  if (!user) {
    throw createError.Unauthorized("User not found in context");
  }

  // Mappa il ruolo dell'utente per il RAG (admin viene trattato come teacher o gestito via sitemap)
  const userRole = user.role as "student" | "teacher" | "admin";

  // Genera la risposta con eventuale azione suggerita (stateless)
  const result = await generateHelpResponseGemini(query, history || [], userRole, currentPath);

  return {
    success: true,
    data: {
      content: result.content,
      suggestedAction: result.suggestedAction
    }
  };
};

export const handler = lambdaRequest(askSyllexHelpAssistant);
