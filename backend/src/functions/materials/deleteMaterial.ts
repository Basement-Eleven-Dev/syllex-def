import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Material } from "../../models/schemas/material.schema";
import { FileEmbedding } from "../../models/schemas/file-embedding.schema";
import { Communication } from "../../models/schemas/communication.schema";

const deleteMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  // Validate and parse input
  const materialId = new mongo.ObjectId(request.pathParameters!.materialId!);
  const teacherId = context.user?._id;

  // Verify the material exists and belongs to the teacher
  const material = await Material.findOne({
    _id: materialId as any,
    teacherId: teacherId as any,
  });

  if (!material) {
    throw createError(404, "Materiale non trovato");
  }

  // Delete the material
  const deleteResult = await Material.deleteOne({
    _id: materialId as any,
    teacherId: teacherId as any,
  });

  if (deleteResult.deletedCount > 0) {
    // eliminiamo la referenza al materiale da tutte le comunicazioni che lo contengonoo
    await Communication.updateMany({ materialIds: materialId }, {
      $pull: { materialIds: materialId },
    } as any);
  }

  // Remove material reference from all parent folders
  const removeFromParentsResult = await Material.updateMany(
    {
      content: materialId as any,
      teacherId: teacherId as any,
    },
    { $pull: { content: materialId } }
  );

  //rimuovi gli embeddings del materiale
  await FileEmbedding.deleteMany({ referenced_file_id: materialId });
  return {
    success: true,
    deleted: deleteResult.deletedCount > 0,
    removedFromParents: removeFromParentsResult.modifiedCount,
  };
};

export const handler = lambdaRequest(deleteMaterial);
