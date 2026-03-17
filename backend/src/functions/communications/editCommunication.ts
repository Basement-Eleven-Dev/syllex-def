import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { Communication } from "../../models/schemas/communication.schema";

const editCommunication = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const communicationId = request.pathParameters?.communicationId;

  if (!communicationId) {
    throw createError.BadRequest("communicationId is required");
  }

  const communicationData = JSON.parse(request.body || "{}");

  await connectDatabase();

  // Verifica che la comunicazione esista e appartenga al teacher
  const existingCommunication = await Communication.findOne({
    _id: communicationId,
    teacherId: context.user?._id,
  } as any);

  if (!existingCommunication) {
    throw createError.NotFound("Communication not found or not authorized");
  }

  const updateData: any = {
    title: communicationData.title,
    content: communicationData.content,
    classIds: communicationData.classIds.map((id: string) => new Types.ObjectId(id)),
    materialIds: communicationData.materialIds.map(
      (id: string) => new Types.ObjectId(id),
    ),
    updatedAt: new Date(),
  };

  await Communication.updateOne(
    { _id: communicationId },
    { $set: updateData },
  );

  const updatedCommunication = await Communication.findById(communicationId);

  return { communication: updatedCommunication };
};

export const handler = lambdaRequest(editCommunication);
