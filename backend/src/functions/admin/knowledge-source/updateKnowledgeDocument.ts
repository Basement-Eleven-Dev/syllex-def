import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { KnowledgeDocument } from "../../../models/schemas/knowledge-document.schema";
import { KnowledgeManualEmbedding } from "../../../models/schemas/knowledge-manual-embedding.schema";

const updateKnowledgeDocument = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const id = request.pathParameters?.id;
  const body = JSON.parse(request.body || "{}");
  const { name, role } = body;

  if (!id) {
    throw createError.BadRequest("ID is required");
  }

  await connectDatabase();

  const doc = await KnowledgeDocument.findById(id);
  if (!doc) {
    throw createError.NotFound("Document not found");
  }

  const oldRole = doc.role;
  const updateData: any = {};
  if (name) updateData.name = name;
  if (role) updateData.role = role;

  // 1. Update the document itself
  const updatedDoc = await KnowledgeDocument.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  );

  // 2. If the role has changed, perform a bulk update on the embeddings
  if (role && role !== oldRole) {
    console.log(`Updating role from ${oldRole} to ${role} for embeddings of doc ${id}`);
    await KnowledgeManualEmbedding.updateMany(
      { referenced_file_id: id },
      { $set: { role: role } }
    );
  }

  return {
    success: true,
    data: updatedDoc
  };
};

export const handler = lambdaRequest(updateKnowledgeDocument);
