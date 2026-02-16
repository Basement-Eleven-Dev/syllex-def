import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const createEvent = async (request: APIGatewayProxyEvent, context: Context) => {
  const eventData = JSON.parse(request.body || "{}");

  const db = await getDefaultDatabase();
  const eventsCollection = db.collection("events");

  const newEvent = {
    title: eventData.title,
    description: eventData.description || "",
    date: new Date(eventData.date),
    time: eventData.time || null,
    teacherId: context.user?._id,
    subjectId: new ObjectId(eventData.subjectId),
    createdAt: new Date(),
  };

  const result = await eventsCollection.insertOne(newEvent);

  return {
    event: {
      ...newEvent,
      _id: result.insertedId,
    },
  };
};

export const handler = lambdaRequest(createEvent);
