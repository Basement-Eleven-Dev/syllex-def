import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

interface GetAssistantRequest {
  agent: {
    subjectId: string;
    teacherId: string;
  };
}

const getAssistant = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const teacherId = context.user?._id;
  if (!teacherId) {
    throw createError(401, "Utente non autenticato");
  }

  // Allow subjectId from query params or body
  const subjectId =
    request.queryStringParameters?.subjectId ||
    JSON.parse(request.body || "{}").subjectId;

  if (!subjectId) {
    throw createError(400, "subjectId è richiesto");
  }

  const db = await getDefaultDatabase();
  const assistantsCollection = db.collection("assistants");

  const assistant = await assistantsCollection.findOne({
    subjectId: new ObjectId(subjectId as string),
    teacherId: teacherId instanceof ObjectId ? teacherId : new ObjectId(teacherId as string),
  });

  return {
    success: true,
    exists: !!assistant,
    assistant: assistant,
  };
};

export const handler = lambdaRequest(getAssistant);
