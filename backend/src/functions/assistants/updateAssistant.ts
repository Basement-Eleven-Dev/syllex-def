import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const updateAssistant = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { assistantId, agent } = body;
  const teacherId = context.user?._id;

  if (!assistantId) {
    throw createError(400, "assistantId è richiesto");
  }

  if (!agent) {
    throw createError(400, "Dati dell'agente richiesti");
  }

  const db = await getDefaultDatabase();
  const assistantsCollection = db.collection("assistants");

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (agent.name) updateData.name = agent.name;
  if (agent.tone) updateData.tone = agent.tone;
  if (agent.voice) updateData.voice = agent.voice;
  if (agent.subjectId) updateData.subjectId = new ObjectId(agent.subjectId);

  const result = await assistantsCollection.updateOne(
    {
      _id: new ObjectId(assistantId),
      teacherId:
        teacherId instanceof ObjectId
          ? teacherId
          : new ObjectId((teacherId as unknown as string) || ""),
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
