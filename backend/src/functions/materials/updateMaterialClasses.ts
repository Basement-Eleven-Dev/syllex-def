import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { Material } from "../../models/schemas/material.schema";
import { connectDatabase } from "../../_helpers/getDatabase";

const updateMaterialClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const materialId = request.pathParameters?.materialId;

  if (!materialId) {
    throw createError.BadRequest("materialId is required");
  }

  const body = JSON.parse(request.body || "{}");

  if (!Array.isArray(body.classIds)) {
    throw createError.BadRequest("classIds must be an array");
  }
  await connectDatabase();

  // Verify material exists and belongs to the teacher
  const existingMaterial = await Material.findOne({
    _id: new mongo.ObjectId(materialId) as any,
    teacherId: context.user?._id as any,
  });

  if (!existingMaterial) {
    throw createError.NotFound("Material not found or not authorized");
  }

  // Update classIds
  const result = await Material.updateOne(
    { _id: new mongo.ObjectId(materialId) as any },
    {
      $set: {
        classIds: body.classIds.map((id: string) => new mongo.ObjectId(id)),
        updatedAt: new Date(),
      },
    }
  );

  if (result.modifiedCount === 0) {
    throw createError.InternalServerError("Failed to update material classes");
  }

  // Return updated material
  const updatedMaterial = await Material.findOne({
    _id: new mongo.ObjectId(materialId) as any,
  });

  return {
    success: true,
    material: updatedMaterial,
  };
};

export const handler = lambdaRequest(updateMaterialClasses);
