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
  const materialId = request.pathParameters!.materialId;

  if (!materialId) {
    throw createError.BadRequest("materialId is required");
  }

  const body = JSON.parse(request.body || "{}");

  if (!Array.isArray(body.classIds)) {
    throw createError.BadRequest("classIds must be an array");
  }
  await connectDatabase();

  // Update classIds atomically and return updated doc
  const updatedMaterial = await Material.findOneAndUpdate(
    {
      _id: new mongo.ObjectId(materialId) as any,
      teacherId: context.user?._id as any,
    },
    {
      $set: {
        classIds: body.classIds.map((id: string) => new mongo.ObjectId(id)),
        updatedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  ).lean();

  if (!updatedMaterial) {
    throw createError.NotFound("Material not found or not authorized");
  }

  return {
    success: true,
    material: updatedMaterial,
  };
};

export const handler = lambdaRequest(updateMaterialClasses);
