import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getCommunicationById = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const communicationId = request.pathParameters?.communicationId;

  if (!communicationId) {
    throw createError.BadRequest("communicationId is required");
  }

  const db = await getDefaultDatabase();
  const communicationsCollection = db.collection("communications");

  const communication = await communicationsCollection.findOne({
    _id: new ObjectId(communicationId),
  });

  if (!communication) {
    throw createError.NotFound("Communication not found");
  }

  return { communication };
};

export const handler = lambdaRequest(getCommunicationById);
