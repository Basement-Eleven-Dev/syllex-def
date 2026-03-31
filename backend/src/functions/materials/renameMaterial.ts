import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { Material } from "../../models/schemas/material.schema";
import { connectDatabase } from "../../_helpers/getDatabase";

const renameMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  // Validate and parse input
  const materialId = new Types.ObjectId(request.pathParameters!.materialId!);
  const body = JSON.parse(request.body || "{}");
  const newName = body.newName?.trim();

  if (!newName) {
    throw createError(400, "Il nuovo nome è richiesto");
  }
  await connectDatabase();

  const teacherId = context.user?._id;

  // Update material name
  const updateResult = await Material.updateOne(
    {
      _id: materialId as any,
      teacherId: teacherId as any,
    },
    { $set: { name: newName } }
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
