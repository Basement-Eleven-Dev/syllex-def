import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const deleteEvent = async (request: APIGatewayProxyEvent, context: Context) => {
  const eventId = request.pathParameters?.eventId;

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

  await eventsCollection.deleteOne({
    _id: new ObjectId(eventId),
  });

  return { success: true, message: "Event deleted successfully" };
};

export const handler = lambdaRequest(deleteEvent);
