import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Communication } from "../../models/schemas/communication.schema";

const getCommunicationById = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const communicationId = request.pathParameters?.communicationId;

  if (!communicationId) {
    throw createError.BadRequest("communicationId is required");
  }

  await connectDatabase();

  const communication = await Communication.findById(communicationId);

  if (!communication) {
    throw createError.NotFound("Communication not found");
  }

  return { communication };
};

export const handler = lambdaRequest(getCommunicationById);
