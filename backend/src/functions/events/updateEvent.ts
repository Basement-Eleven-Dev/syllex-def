import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Event } from "../../models/schemas/event.schema";

const updateEvent = async (request: APIGatewayProxyEvent, context: Context) => {
  const eventId = request.pathParameters!.eventId;
  const eventData = JSON.parse(request.body || "{}");

  await connectDatabase();

  const existingEvent = await Event.findOne({
    _id: eventId,
    teacherId: context.user?._id,
  } as any);

  if (!existingEvent) {
    throw createError.NotFound("Event not found or not authorized");
  }

  const updatedEvent = await Event.findOneAndUpdate(
    { _id: eventId, teacherId: context.user?._id },
    {
      $set: {
        title: eventData.title || existingEvent.title,
        description: eventData.description !== undefined ? eventData.description : existingEvent.description,
        date: eventData.date ? new Date(eventData.date) : existingEvent.date,
        time: eventData.time !== undefined ? eventData.time : existingEvent.time,
        updatedAt: new Date(),
      }
    },
    { new: true, runValidators: true }
  ).lean();

  return {
    event: updatedEvent,
  };
};

export const handler = lambdaRequest(updateEvent);
