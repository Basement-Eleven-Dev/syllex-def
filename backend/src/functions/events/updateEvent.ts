import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Event } from "../../models/schemas/event.schema";

const updateEvent = async (request: APIGatewayProxyEvent, context: Context) => {
  const eventId = request.pathParameters?.eventId;
  const eventData = JSON.parse(request.body || "{}");

  if (!eventId) {
    throw createError.BadRequest("eventId is required");
  }

  await connectDatabase();

  const existingEvent = await Event.findOne({
    _id: eventId,
    teacherId: context.user?._id,
  } as any);

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

  await Event.updateOne(
    { _id: eventId },
    { $set: updateData }
  );

  const updatedEvent = await Event.findById(eventId).lean();

  return {
    event: updatedEvent,
  };
};

export const handler = lambdaRequest(updateEvent);
