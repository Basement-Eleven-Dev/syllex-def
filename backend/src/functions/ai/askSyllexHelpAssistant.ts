import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { generateHelpResponseGemini } from "../../_helpers/AI/generateHelpResponse";

const askSyllexHelpAssistant = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { query, history } = body;

  if (!query) {
    throw createError.BadRequest("Query is required");
  }

  const user = context.user;
  if (!user) {
    throw createError.Unauthorized("User not found in context");
  }

  // Mappa il ruolo dell'utente per il RAG (admin viene trattato come teacher)
  const userRole: "student" | "teacher" = user.role === "student" ? "student" : "teacher";

  // Genera la risposta (stateless, non salva nulla a DB come richiesto)
  const response = await generateHelpResponseGemini(query, history || [], userRole);

  return {
    success: true,
    data: {
      content: response
    }
  };
};

export const handler = lambdaRequest(askSyllexHelpAssistant);
