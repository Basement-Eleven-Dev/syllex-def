import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const removeMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const { assistantId, materialId } = JSON.parse(request.body || "{}");
  const teacherId = context.user?._id;

  if (!assistantId || !materialId) {
    throw createError(400, "assistantId e materialId sono richiesti");
  }

  if (!teacherId) {
    throw createError(401, "Utente non autenticato");
  }

  const db = await getDefaultDatabase();
  const assistantsCollection = db.collection("assistants");

  const result = await assistantsCollection.updateOne(
    { 
        _id: new ObjectId(assistantId), 
        teacherId: teacherId instanceof ObjectId ? teacherId : new ObjectId(teacherId as string) 
    },
    { 
      $pull: { 
        associatedFileIds: { $in: [new ObjectId(materialId), materialId] } 
      } 
    } as any
  );

  if (result.matchedCount === 0) {
    throw createError(404, "Assistente non trovato o non autorizzato");
  }

  return {
    success: true,
    message: "Materiale rimosso con successo",
  };
};

export const handler = lambdaRequest(removeMaterial);
