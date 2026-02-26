import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const updateEvent = async (request: APIGatewayProxyEvent, context: Context) => {
  const eventId = request.pathParameters?.eventId;
  const eventData = JSON.parse(request.body || "{}");

  if (!eventId) {
    throw createError.BadRequest("eventId is required");
  }

  const db = await getDefaultDatabase();
  const eventsCollection = db.collection("events");

  const existingEvent = await eventsCollection.findOne({
    _id: new ObjectId(eventId),
    teacherId: context.user?._id,
  });

  if (!existingEvent) {
    throw createError.NotFound("Event not found or not authorized");
  }

  const updateData = {
    title: eventData.title || existingEvent.title,
    description: eventData.description !== undefined ? eventData.description : existingEvent.description,
    date: eventData.date ? new Date(eventData.date) : existingEvent.date,
    time: eventData.time !== undefined ? eventData.time : existingEvent.time,
    updatedAt: new Date(),
  };

  await eventsCollection.updateOne(
    { _id: new ObjectId(eventId) },
    { $set: updateData }
  );

  return {
    event: {
      ...existingEvent,
      ...updateData,
      _id: eventId,
    },
  };
};

export const handler = lambdaRequest(updateEvent);
