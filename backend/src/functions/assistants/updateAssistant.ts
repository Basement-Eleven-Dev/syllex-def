import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Assistant } from "../../models/schemas/assistant.schema";

const updateAssistant = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const agent = JSON.parse(request.body || "{}");
  const teacherId = context.user?._id;
  const subjectId = context.subjectId
  if (!agent) {
    throw createError(400, "Dati dell'agente richiesti");
  }
  if (!subjectId) {
    throw createError.BadRequest('Header subject-id richiesto')
  }

  await connectDatabase();

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (agent.name) updateData.name = agent.name;
  if (agent.tone) updateData.tone = agent.tone;
  if (agent.voice) updateData.voice = agent.voice;

  const result = await Assistant.updateOne(
    {
      subjectId: subjectId,
      teacherId: teacherId
    },
    { $set: updateData },
  );

  if (result.matchedCount === 0) {
    throw createError(404, "Assistente non trovato");
  }

  return {
    success: true,
    message: "Assistente aggiornato con successo",
  };
};

export const handler = lambdaRequest(updateAssistant);
