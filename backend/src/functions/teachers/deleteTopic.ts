import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { Topic } from "../../models/schemas/topic.schema";

const deleteTopic = async (request: APIGatewayProxyEvent, context: Context) => {
  const subjectId = context.subjectId;
  if (!subjectId) {
    throw createError.BadRequest("Subject-Id header is required");
  }
  const topicId = request.pathParameters!.topicId!;

  let result = await Topic.deleteOne({
    _id: topicId,
    subjectId,
  });

  if (result.deletedCount === 1) {
    return { success: true, deleted: true };
  }
  console.error("Error deleting topic:");
  return { success: false, deleted: false };
};

export const handler = lambdaRequest(deleteTopic);
