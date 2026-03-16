import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const removeMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const materialId = request.pathParameters?.materialId || ''
  const teacherId = context.user?._id;

  const db = await getDefaultDatabase();
  const assistantsCollection = db.collection("assistants");

  const result = await assistantsCollection.updateOne(
    {
      subjectId: context.subjectId,
      teacherId: teacherId
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
