import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Communication } from "../../models/schemas/communication.schema";

const deleteCommunication = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const communicationId = request.pathParameters?.communicationId;

  if (!communicationId) {
    throw createError.BadRequest("communicationId is required");
  }

  await connectDatabase();

  // Verifica che la comunicazione esista e appartenga al teacher
  const existingCommunication = await Communication.findOne({
    _id: communicationId,
    teacherId: context.user?._id,
  } as any);

  if (!existingCommunication) {
    throw createError.NotFound("Communication not found or not authorized");
  }

  await Communication.deleteOne({
    _id: communicationId,
  });

  return { success: true, message: "Communication deleted successfully" };
};

export const handler = lambdaRequest(deleteCommunication);
