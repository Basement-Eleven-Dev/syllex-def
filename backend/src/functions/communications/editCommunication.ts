import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Communication } from "../../models/schemas/communication.schema";

const editCommunication = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const communicationId = request.pathParameters!.communicationId;

  const communicationData = JSON.parse(request.body || "{}");

  await connectDatabase();


  const updatedCommunication = await Communication.findOneAndUpdate(
    { _id: new mongo.ObjectId(communicationId), teacherId: context.user?._id },
    {
      $set: {
        title: communicationData.title,
        content: communicationData.content,
        classIds: communicationData.classIds.map((id: string) => new Types.ObjectId(id)),
        materialIds: communicationData.materialIds.map(
          (id: string) => new Types.ObjectId(id),
        ),
        updatedAt: new Date(),
      }
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedCommunication) {
    throw createError.NotFound("Communication not found or not authorized");
  }

  return { communication: updatedCommunication };
};

export const handler = lambdaRequest(editCommunication);
