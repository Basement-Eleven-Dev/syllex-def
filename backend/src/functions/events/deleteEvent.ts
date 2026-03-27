import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Event } from "../../models/schemas/event.schema";

const deleteEvent = async (request: APIGatewayProxyEvent, context: Context) => {
  const eventId = request.pathParameters?.eventId;

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

  await Event.deleteOne({
    _id: eventId,
  });

  return { success: true, message: "Event deleted successfully" };
};

export const handler = lambdaRequest(deleteEvent);
