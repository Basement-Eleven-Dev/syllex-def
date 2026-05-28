import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
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

  let communication: any;

  if (context.user?.role === "student" && context.user?._id) {
    // Auto mark-as-read: add student id to readBy if not already present
    communication = await Communication.findOneAndUpdate(
      { _id: communicationId },
      { $addToSet: { readBy: new Types.ObjectId(context.user._id) } },
      { new: true },
    ).lean();
  } else {
    communication = await Communication.findById(communicationId).lean();
  }

  if (!communication) {
    throw createError.NotFound("Communication not found");
  }

  const readCount: number =
    (communication.readBy as Types.ObjectId[])?.length ?? 0;
  const isRead: boolean =
    context.user?.role === "student"
      ? true // student just triggered the mark, so it's read
      : false;

  const { readBy: _readBy, ...communicationSafe } = communication as any;

  return { communication: { ...communicationSafe, isRead, readCount } };
};

export const handler = lambdaRequest(getCommunicationById);
