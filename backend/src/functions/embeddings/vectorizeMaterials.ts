import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { associateFilesToAssistant } from "../../_helpers/documents/associateFileToAssistant";

const associateMaterials = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { materialIds, assistantId } = body;
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

  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");

  const results = [];

  for (const id of materialIds) {
    try {
      const material = await materialsCollection.findOne({
        _id: new ObjectId(id),
        teacherId: new ObjectId(teacherId),
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
    await associateFilesToAssistant(assistantId, materialIds);
  }

  return {
    success: true,
    results,
  };
};

export const handler = lambdaRequest(associateMaterials);
