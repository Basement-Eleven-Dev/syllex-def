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
  const subjectsCollection = db.collection("SUBJECTS");
  const assistantsCollection = db.collection("assistants");

  // Trova la materia per identificare il proprietario (teacherId)
  const subject = await subjectsCollection.findOne({ _id: new ObjectId(subjectId as string) });
  
  if (!subject) {
    return {
      success: true,
      exists: false,
      message: "Subject not found"
    };
  }

  // Cerca l'assistente associato a questa materia e a quel docente
  const assistant = await assistantsCollection.findOne({
    subjectId: new ObjectId(subjectId as string),
    teacherId: subject.teacherId,
  });

  return {
    success: true,
    exists: !!assistant,
    assistant: assistant,
  };
};

export const handler = lambdaRequest(getAssistant);
