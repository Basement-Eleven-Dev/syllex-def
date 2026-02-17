import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

interface GetAssistantRequest {
  agent: {
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

  const subjectId = context.subjectId;

  if (!subjectId) {
    throw createError(400, "subjectId è richiesto");
  }

  const db = await getDefaultDatabase();
  const subjectsCollection = db.collection("SUBJECTS");
  const assistantsCollection = db.collection("assistants");

  // Trova la materia per identificare il proprietario (teacherId)
  const subject = await subjectsCollection.findOne({ _id: subjectId });

  if (!subject) {
    return {
      success: true,
      exists: false,
      message: "Subject not found",
    };
  }

  // Cerca l'assistente associato a questa materia e a quel docente
  const assistant = await assistantsCollection.findOne({
    subjectId: subjectId,
    teacherId: subject.teacherId,
  });

  return {
    success: true,
    exists: !!assistant,
    assistant: assistant,
  };
};

export const handler = lambdaRequest(getAssistant);
