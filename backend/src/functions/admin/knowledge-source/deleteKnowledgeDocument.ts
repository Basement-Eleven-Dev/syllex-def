import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { KnowledgeDocument } from "../../../models/schemas/knowledge-document.schema";
import createError from "http-errors";
import { mongo } from "mongoose";

const deleteKnowledgeDocument = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  const id = request.pathParameters?.id;

  if (!id) {
    throw createError.BadRequest("Document ID is required");
  }

  const result = await KnowledgeDocument.findByIdAndDelete(new mongo.ObjectId(id));

  if (!result) {
    throw createError.NotFound("Document not found");
  }

  return {
    success: true,
    message: "Document deleted successfully"
  };
};

export const handler = lambdaRequest(deleteKnowledgeDocument);
