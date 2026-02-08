import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const createCommunication = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const communicationData = JSON.parse(request.body || "{}");

  const db = await getDefaultDatabase();
  const communicationsCollection = db.collection("communications");

  const newCommunication = {
    title: communicationData.title,
    content: communicationData.content,
    classIds: communicationData.classIds.map((id: string) => new ObjectId(id)),
    materialIds: communicationData.materialIds.map(
      (id: string) => new ObjectId(id),
    ),
    subjectId: new ObjectId(communicationData.subjectId),
    teacherId: context.user?._id,
    createdAt: new Date(),
  };

  const result = await communicationsCollection.insertOne(newCommunication);

  return {
    communication: {
      ...newCommunication,
      _id: result.insertedId,
    },
  };
};

export const handler = lambdaRequest(createCommunication);
