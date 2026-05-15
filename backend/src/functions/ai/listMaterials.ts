import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Material } from "../../models/schemas/material.schema";
import { connectDatabase } from "../../_helpers/getDatabase";

const listMaterials = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const user = context.user;
  const subjectId = context.subjectId;
  if (!user || !subjectId) {
    throw createError.Unauthorized("User or subject not found in context");
  }

  await connectDatabase();

  const materials = await Material.find(
    {
      subjectId,
      type: "file",
      vectorized: true,
      $or: [{ aiGenerated: { $exists: false } }, { aiGenerated: false }],
    },
    { _id: 1, name: 1, extension: 1, createdAt: 1 },
  )
    .sort({ createdAt: -1 })
    .lean();

  return {
    materials: materials.map((m) => ({
      id: m._id,
      name: m.name,
      extension: m.extension || "",
    })),
  };
};

export const handler = lambdaRequest(listMaterials);
