import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

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

  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");

  // Verify material exists and belongs to the teacher
  const existingMaterial = await materialsCollection.findOne({
    _id: new ObjectId(materialId),
    teacherId: context.user?._id,
  });

  if (!existingMaterial) {
    throw createError.NotFound("Material not found or not authorized");
  }

  // Update classIds
  const result = await materialsCollection.updateOne(
    { _id: new ObjectId(materialId) },
    {
      $set: {
        classIds: body.classIds.map((id: string) => new ObjectId(id)),
        updatedAt: new Date(),
      },
    },
  );

  if (result.modifiedCount === 0) {
    throw createError.InternalServerError("Failed to update material classes");
  }

  // Return updated material
  const updatedMaterial = await materialsCollection.findOne({
    _id: new ObjectId(materialId),
  });

  return {
    success: true,
    material: updatedMaterial,
  };
};

export const handler = lambdaRequest(updateMaterialClasses);
