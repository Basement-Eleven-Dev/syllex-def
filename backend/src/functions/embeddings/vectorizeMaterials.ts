import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { associateFilesToAssistant } from "../../_helpers/documents/associateFileToAssistant";
import { Material } from "../../models/schemas/material.schema";
import { connectDatabase } from "../../_helpers/getDatabase";
import { mongo } from "mongoose"

const associateMaterials = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  const body = JSON.parse(request.body || "{}");
  const { materialIds, assistantId } = body as { materialIds?: string[], assistantId?: string };
  const teacherId = context.user?._id;

  if (!materialIds || !Array.isArray(materialIds)) {
    return {
      success: false,
      message: "materialIds array is required",
    };
  }

  if (!teacherId) {
    return {
      success: false,
      message: "Authentication required",
    };
  }

  const results = [];

  for (const id of materialIds) {
    try {
      const material = await Material.findOne({
        _id: new mongo.ObjectId(id) as any,
        teacherId: new mongo.ObjectId(teacherId) as any,
      });

      if (!material) {
        results.push({ id, status: "skipped", reason: "Material not found" });
        continue;
      }

      if (!material.url) {
        results.push({
          id,
          status: "skipped",
          reason: "Material URL is missing",
        });
        continue;
      }

      // Non facciamo più estrazione / vettorizzazione
      results.push({ id, status: "ready" });
    } catch (error) {
      console.error(`Error processing material ${id}:`, error);
      results.push({ id, status: "error", error: (error as any).message });
    }
  }

  // Associazione dei file all'assistente
  if (assistantId && materialIds.length > 0) {
    await associateFilesToAssistant(new mongo.ObjectId(assistantId), materialIds.map(el => new mongo.ObjectId(el)));
  }

  return {
    success: true,
    results,
  };
};

export const handler = lambdaRequest(associateMaterials);
