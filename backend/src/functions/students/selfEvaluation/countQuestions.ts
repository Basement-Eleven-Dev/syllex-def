import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { mongo } from "mongoose";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Question } from "../../../models/schemas/question.schema";

const countQuestions = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const {
    subjectId,
    topicIds = "",
    excludedTypes = "",
  } = request.queryStringParameters || {};

  if (!subjectId) {
    return { count: 0 };
  }

  await connectDatabase();

  const topicObjectIds = topicIds
    ? topicIds
        .split(",")
        .filter((id) => id.length > 0)
        .map((id) => new mongo.ObjectId(id))
    : [];
  const excludedTypesList = excludedTypes
    ? excludedTypes.split(",").filter((t) => t.length > 0)
    : [];

  const filter: any = {
    subjectId: new mongo.ObjectId(subjectId),
  };

  if (topicObjectIds.length > 0) {
    filter.topicId = { $in: topicObjectIds };
  }

  if (excludedTypesList.length > 0) {
    filter.type = { $nin: excludedTypesList };
  }

  const count = await Question.countDocuments(filter);

  return {
    count,
  };
};

export const handler = lambdaRequest(countQuestions);
