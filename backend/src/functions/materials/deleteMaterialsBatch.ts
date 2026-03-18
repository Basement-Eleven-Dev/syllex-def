import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Material } from "../../models/schemas/material.schema";
import { Communication } from "../../models/schemas/communication.schema";
import { FileEmbedding } from "../../models/schemas/file-embedding.schema";

const deleteMaterialsBatch = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  const { materialIds } = JSON.parse(request.body || "{}") as {
    materialIds: string[];
  };

  if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
    throw createError(400, "materialIds array is required");
  }

  const teacherId = context.user?._id;
  const objectIds = materialIds.map((id) => new mongo.ObjectId(id));

  // Verify all materials exist and belong to the teacher
  const validMaterials = await Material
    .find({
      _id: { $in: objectIds as any },
      teacherId: teacherId as any,
    })

  if (validMaterials.length === 0) {
    throw createError(404, "Nessun materiale trovato o autorizzato");
  }

  const validObjectIds = validMaterials.map((m) => m._id);

  // Delete the materials
  const deleteResult = await Material.deleteMany({
    _id: { $in: validObjectIds as any },
    teacherId: teacherId as any,
  });

  if (deleteResult.deletedCount > 0) {
    // eliminiamo la referenza al materiale da tutte le comunicazioni che lo contengono

    await Communication.updateMany(
      { materialIds: { $in: validObjectIds } },
      { $pull: { materialIds: { $in: validObjectIds } } } as any,
    );
  }

  // Remove material reference from all parent folders
  const removeFromParentsResult = await Material.updateMany(
    {
      content: { $in: validObjectIds as any },
      teacherId: teacherId as any,
    },
    { $pull: { content: { $in: validObjectIds } } }
  );

  // rimuovi gli embeddings del materiale

  await FileEmbedding.deleteMany({
    referenced_file_id: { $in: validObjectIds },
  });

  return {
    success: true,
    deletedCount: deleteResult.deletedCount,
    removedFromParents: removeFromParentsResult.modifiedCount,
  };
};

export const handler = lambdaRequest(deleteMaterialsBatch);
