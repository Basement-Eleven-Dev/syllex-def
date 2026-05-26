import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { retrieveRelevantDocumentsWithGemini } from "../../_helpers/AI/embeddings/retrieveRelevantDocuments";
import { Material } from "../../models/schemas/material.schema";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";

const askSyllexHelpAssistant = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { query, limit, documentName } = body;

  if (!query) {
    throw createError.BadRequest("Query is required");
  }

  const user = context.user;
  const subjectId = context.subjectId;
  if (!user || !subjectId) {
    throw createError.Unauthorized("User or subject not found in context");
  }

  await connectDatabase();

  // Recupera solo i materiali reali (non AI-generated) già vettorizzati
  const realMaterials = await Material.find(
    {
      subjectId,
      type: "file",
      vectorized: true,
      $or: [{ aiGenerated: { $exists: false } }, { aiGenerated: false }],
    },
    { _id: 1, name: 1 },
  ).lean();

  let filteredIds = realMaterials.map((m) => m._id as Types.ObjectId);

  // Se specificato un documentName, filtra per nome
  if (documentName && typeof documentName === "string") {
    const normalizedFilter = documentName.toLowerCase();
    const matchingMaterials = realMaterials.filter((m) =>
      m.name.toLowerCase().includes(normalizedFilter),
    );
    if (matchingMaterials.length > 0) {
      filteredIds = matchingMaterials.map((m) => m._id as Types.ObjectId);
    }
  }

  const relevantDocuments = await retrieveRelevantDocumentsWithGemini(
    query,
    subjectId,
    filteredIds.length > 0 ? filteredIds : undefined,
    limit || 8,
    "voice",
  );
  console.log("Relevant documents found:", relevantDocuments.length);

  return {
    relevantDocuments,
  };
};

export const handler = lambdaRequest(askSyllexHelpAssistant);
