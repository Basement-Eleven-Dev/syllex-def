import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Assistant } from "../../models/schemas/assistant.schema";

const removeMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const materialId = request.pathParameters?.materialId || ''
  const teacherId = context.user?._id;

  await connectDatabase()

  const result = await Assistant.updateOne(
    {
      subjectId: context.subjectId,
      teacherId: teacherId
    },
    {
      $pull: {
        associatedFileIds: { $in: [new mongo.ObjectId(materialId), materialId] }
      }
    }
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
