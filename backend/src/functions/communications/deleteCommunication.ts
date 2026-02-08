import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const deleteCommunication = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const communicationId = request.pathParameters?.communicationId;

  if (!communicationId) {
    throw createError.BadRequest("communicationId is required");
  }

  const db = await getDefaultDatabase();
  const communicationsCollection = db.collection("communications");

  // Verifica che la comunicazione esista e appartenga al teacher
  const existingCommunication = await communicationsCollection.findOne({
    _id: new ObjectId(communicationId),
    teacherId: context.user?._id,
  });

  if (!existingCommunication) {
    throw createError.NotFound("Communication not found or not authorized");
  }

  await communicationsCollection.deleteOne({
    _id: new ObjectId(communicationId),
  });

  return { success: true, message: "Communication deleted successfully" };
};

export const handler = lambdaRequest(deleteCommunication);
