import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import { Material } from "../../models/schemas/material.schema";
import { connectDatabase } from "../../_helpers/getDatabase";

const getMaterialById = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = context.user?._id;
  if (!studentId) {
    return { success: false, message: "Unauthorized" };
  }

  const materialId = request.pathParameters?.materialId;
  if (!materialId) {
    return { success: false, message: "materialId is required" };
  }
  await connectDatabase();

  const material = await Material.findOne({
    _id: new mongo.ObjectId(materialId) as any,
  })

  if (!material) {
    return { success: false, message: "Material not found or not accessible" };
  }

  return { success: true, material };
};

export const handler = lambdaRequest(getMaterialById);
