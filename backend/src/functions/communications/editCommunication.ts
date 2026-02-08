import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const editCommunication = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const communicationId = request.pathParameters?.communicationId;

  if (!communicationId) {
    throw createError.BadRequest("communicationId is required");
  }

  const communicationData = JSON.parse(request.body || "{}");

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

  const updateData = {
    title: communicationData.title,
    content: communicationData.content,
    classIds: communicationData.classIds.map((id: string) => new ObjectId(id)),
    materialIds: communicationData.materialIds.map(
      (id: string) => new ObjectId(id),
    ),
    updatedAt: new Date(),
  };

  await communicationsCollection.updateOne(
    { _id: new ObjectId(communicationId) },
    { $set: updateData },
  );

  const updatedCommunication = await communicationsCollection.findOne({
    _id: new ObjectId(communicationId),
  });

  return { communication: updatedCommunication };
};

export const handler = lambdaRequest(editCommunication);
