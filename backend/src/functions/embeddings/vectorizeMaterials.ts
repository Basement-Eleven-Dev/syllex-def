import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { extractTextFromFile } from "../../_helpers/documents/extractTextFromFile";
import { vectorizeDocument } from "../../_helpers/AI/embeddings/vectorizeDocument";
import { associateFilesToAssistant } from "../../_helpers/documents/associateFileToAssistant";
import https from "https";

const vectorizeMaterials = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { materialIds, subjectId, assistantId } = body;
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

      // Se è già vettorizzato GLOBALMENTE, non serve rifare il processo
      // Basterà associarlo alla fine (già gestito da associateFilesToAssistant)
      const existingEmbedding = await db.collection("file_embeddings").findOne({
        referenced_file_id: new ObjectId(id)
      });

      if (existingEmbedding) {
        results.push({ id, status: "success", reason: "Already vectorized, just associating" });
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

      // Fetch file content
      const buffer = await fetchBuffer(material.url);

      // Extract text
      const text = await extractTextFromFile(buffer, material.extension || "");

      if (!text || text.trim().length === 0) {
        results.push({ id, status: "skipped", reason: "No text extracted" });
        continue;
      }

      // Vectorize
      await vectorizeDocument({
        fileId: material._id.toString(),
        subject: subjectId!,
        teacherId: teacherId.toString(),
        documentText: text,
        assistantId: assistantId,
      });

      results.push({ id, status: "success" });
    } catch (error) {
      console.error(`Error processing material ${id}:`, error);
      results.push({ id, status: "error", error: (error as any).message });
    }
  }

  if (assistantId && materialIds.length > 0) {
    await associateFilesToAssistant(assistantId, materialIds);
  }

  return {
    success: true,
    results,
  };
};

async function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch file: ${res.statusCode}`));
          return;
        }
        const chunks: any[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", (err) => reject(err));
      })
      .on("error", (err) => reject(err));
  });
}

export const handler = lambdaRequest(vectorizeMaterials);
