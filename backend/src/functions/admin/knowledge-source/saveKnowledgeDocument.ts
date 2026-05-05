import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { KnowledgeDocument } from "../../../models/schemas/knowledge-document.schema";
import createError from "http-errors";
import { startIndexingJob } from "../../../_triggers/backgroundVectorize";  

const saveKnowledgeDocument = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  const body = JSON.parse(request.body || "{}");
  const { name, url, extension, byteSize, role } = body;

  if (!name || !url) {
    throw createError.BadRequest("name and url are required");
  }

  const newDoc = new KnowledgeDocument({
    name,
    url,
    extension,
    byteSize,
    role: role || "both"
  });

  await newDoc.save();

  // Trigger vectorization job

  await startIndexingJob(newDoc._id);

  return {
    success: true,
    data: newDoc
  };
};

export const handler = lambdaRequest(saveKnowledgeDocument);
