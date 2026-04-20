import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { KnowledgeDocument } from "../../../models/schemas/knowledge-document.schema";

const getKnowledgeDocuments = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  const documents = await KnowledgeDocument.find().sort({ createdAt: -1 });

  return documents;
};

export const handler = lambdaRequest(getKnowledgeDocuments);
