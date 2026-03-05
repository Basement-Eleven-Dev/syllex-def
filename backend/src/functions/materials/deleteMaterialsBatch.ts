import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const deleteMaterialsBatch = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const { materialIds } = JSON.parse(request.body || "{}") as {
    materialIds: string[];
  };

  if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
    throw createError(400, "materialIds array is required");
  }

  const teacherId = context.user?._id;
  const objectIds = materialIds.map((id) => new ObjectId(id));

  // Get database connection
  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");

  // Verify all materials exist and belong to the teacher
  const validMaterials = await materialsCollection
    .find({
      _id: { $in: objectIds },
      teacherId,
    })
    .toArray();

  if (validMaterials.length === 0) {
    throw createError(404, "Nessun materiale trovato o autorizzato");
  }

  const validObjectIds = validMaterials.map((m) => m._id);

  // Delete the materials
  const deleteResult = await materialsCollection.deleteMany({
    _id: { $in: validObjectIds },
    teacherId,
  });

  if (deleteResult.deletedCount > 0) {
    // eliminiamo la referenza al materiale da tutte le comunicazioni che lo contengono
    const communicationsCollection = db.collection("communications");
    await communicationsCollection.updateMany(
      { materialIds: { $in: validObjectIds } },
      { $pull: { materialIds: { $in: validObjectIds } } } as any,
    );
  }

  // Remove material reference from all parent folders
  const removeFromParentsResult = await materialsCollection.updateMany(
    {
      content: { $in: validObjectIds },
      teacherId,
    },
    { $pull: { content: { $in: validObjectIds } } } as any,
  );

  // rimuovi gli embeddings del materiale
  const embeddingsCollection = db.collection("file_embeddings");
  await embeddingsCollection.deleteMany({
    referenced_file_id: { $in: validObjectIds },
  });

  return {
    success: true,
    deletedCount: deleteResult.deletedCount,
    removedFromParents: removeFromParentsResult.modifiedCount,
  };
};

export const handler = lambdaRequest(deleteMaterialsBatch);
