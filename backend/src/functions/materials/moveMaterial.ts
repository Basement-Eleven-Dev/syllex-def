import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const moveMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");
  const teacherId = context.user?._id;

  // Support both single and batch operations
  let materialIds: ObjectId[];

  if (body.materialIds && Array.isArray(body.materialIds)) {
    // Batch move operation
    materialIds = body.materialIds.map((id: string) => new ObjectId(id));
  } else if (request.pathParameters?.materialId) {
    // Single move operation (backward compatibility)
    materialIds = [new ObjectId(request.pathParameters.materialId)];
  } else {
    throw createError(400, "materialIds o materialId richiesti");
  }

  // Verify all materials exist and belong to the teacher
  const materials = await materialsCollection
    .find({
      _id: { $in: materialIds },
      teacherId,
    })
    .toArray();

  if (materials.length !== materialIds.length) {
    throw createError(404, "Uno o più materiali non trovati");
  }

  if (body.newParentId === null) {
    // Remove materials from all current parent folders
    const removeFromParentsResult = await materialsCollection.updateMany(
      {
        content: { $in: materialIds },
        teacherId,
      },
      { $pull: { content: { $in: materialIds } } } as any,
    );

    return {
      success: true,
      moved: true,
      movedCount: materialIds.length,
      removedFromParents: removeFromParentsResult.modifiedCount,
    };
  } else {
    const newParentId = new ObjectId(body.newParentId);

    // Verify the new parent folder exists and belongs to the teacher
    const newParent = await materialsCollection.findOne({
      _id: newParentId,
      teacherId,
      type: "folder",
    });

    if (!newParent) {
      throw createError(404, "Cartella di destinazione non trovata");
    }

    // Remove materials from all current parent folders
    const removeFromParentsResult = await materialsCollection.updateMany(
      {
        content: { $in: materialIds },
        teacherId,
      },
      { $pull: { content: { $in: materialIds } } } as any,
    );

    // Add materials to new parent folder (avoiding duplicates)
    const addToNewParentResult = await materialsCollection.updateOne(
      {
        _id: newParentId,
        teacherId,
      },
      { $addToSet: { content: { $each: materialIds } } } as any,
    );

    return {
      success: true,
      moved: addToNewParentResult.modifiedCount > 0,
      movedCount: materialIds.length,
      removedFromParents: removeFromParentsResult.modifiedCount,
    };
  }
};

export const handler = lambdaRequest(moveMaterial);
