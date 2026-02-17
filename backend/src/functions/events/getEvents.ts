import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getEvents = async (request: APIGatewayProxyEvent, context: Context) => {
  const db = await getDefaultDatabase();
  const eventsCollection = db.collection("events");

  const { month, year } = request.queryStringParameters || {};

  const filter: any = {};

  if (context.user?._id) {
    filter.teacherId = context.user._id;
  }

  if (context.subjectId) {
    filter.subjectId = context.subjectId;
  }

  if (month && year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    filter.date = {
      $gte: new Date(y, m, 1),
      $lt: new Date(y, m + 1, 1),
    };
  }

  const events = await eventsCollection
    .find(filter)
    .sort({ date: 1 })
    .toArray();

  return { events };
};

export const handler = lambdaRequest(getEvents);
