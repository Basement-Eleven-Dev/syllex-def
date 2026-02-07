import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const deleteMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  // Validate and parse input
  const materialId = new ObjectId(request.pathParameters!.materialId!);
  const teacherId = context.user?._id;

  // Get database connection
  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");

  // Verify the material exists and belongs to the teacher
  const material = await materialsCollection.findOne({
    _id: materialId,
    teacherId,
  });

  if (!material) {
    throw createError(404, "Materiale non trovato");
  }

  // Delete the material
  const deleteResult = await materialsCollection.deleteOne({
    _id: materialId,
    teacherId,
  });

  // Remove material reference from all parent folders
  const removeFromParentsResult = await materialsCollection.updateMany(
    {
      content: materialId,
      teacherId,
    },
    { $pull: { content: materialId } } as any,
  );

  return {
    success: true,
    deleted: deleteResult.deletedCount > 0,
    removedFromParents: removeFromParentsResult.modifiedCount,
  };
};

export const handler = lambdaRequest(deleteMaterial);
