import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const renameMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  // Validate and parse input
  const materialId = new ObjectId(request.pathParameters!.materialId!);
  const body = JSON.parse(request.body || "{}");
  const newName = body.newName?.trim();

  if (!newName) {
    throw createError(400, "Il nuovo nome è richiesto");
  }

  const teacherId = context.user?._id;

  // Get database connection
  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");

  // Update material name
  const updateResult = await materialsCollection.updateOne(
    {
      _id: materialId,
      teacherId,
    },
    { $set: { name: newName } },
  );

  if (updateResult.matchedCount === 0) {
    throw createError(404, "Materiale non trovato");
  }

  return {
    success: true,
    renamed: updateResult.modifiedCount > 0,
  };
};

export const handler = lambdaRequest(renameMaterial);
