import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { Material } from "../../models/schemas/material.schema";
import { connectDatabase } from "../../_helpers/getDatabase";

const moveMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const teacherId = context.user?._id;

  // Support both single and batch operations
  let materialIds: Types.ObjectId[];

  if (body.materialIds && Array.isArray(body.materialIds)) {
    // Batch move operation
    materialIds = body.materialIds.map((id: string) => new mongo.ObjectId(id));
  } else if (request.pathParameters?.materialId) {
    // Single move operation (backward compatibility)
    materialIds = [new mongo.ObjectId(request.pathParameters.materialId)];
  } else {
    throw createError(400, "materialIds o materialId richiesti");
  }
  await connectDatabase();

  // Verify all materials exist and belong to the teacher
  const materials = await Material
    .find({
      _id: { $in: materialIds as any },
      teacherId: teacherId as any,
    })

  if (materials.length !== materialIds.length) {
    throw createError(404, "Uno o più materiali non trovati");
  }

  if (body.newParentId === null) {
    // Remove materials from all current parent folders
    const removeFromParentsResult = await Material.updateMany(
      {
        content: { $in: materialIds as any },
        teacherId: teacherId as any,
      },
      { $pull: { content: { $in: materialIds } } }
    );

    return {
      success: true,
      moved: true,
      movedCount: materialIds.length,
      removedFromParents: removeFromParentsResult.modifiedCount,
    };
  } else {
    const newParentId = new mongo.ObjectId(body.newParentId);

    // Verify the new parent folder exists and belongs to the teacher
    const newParent = await Material.findOne({
      _id: newParentId as any,
      teacherId: teacherId as any,
      type: "folder",
    });

    if (!newParent) {
      throw createError(404, "Cartella di destinazione non trovata");
    }

    // Remove materials from all current parent folders
    const removeFromParentsResult = await Material.updateMany(
      {
        content: { $in: materialIds as any },
        teacherId: teacherId as any,
      },
      { $pull: { content: { $in: materialIds } } }
    );

    // Add materials to new parent folder (avoiding duplicates)
    const addToNewParentResult = await Material.updateOne(
      {
        _id: newParentId as any,
        teacherId: teacherId as any,
      },
      { $addToSet: { content: { $each: materialIds } } }
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
