import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const deleteQuestion = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const questionId = request.pathParameters?.questionId;

  if (!questionId) {
    throw createError.BadRequest("questionId is required");
  }

  const db = await getDefaultDatabase();
  const questionsCollection = db.collection("questions");

  const result = await questionsCollection.deleteOne({
    _id: new ObjectId(questionId),
    teacherId: context.user?._id,
  });

  if (result.deletedCount === 0) {
    throw createError.NotFound("Question not found or not authorized");
  }

  return { deleted: true };
};

export const handler = lambdaRequest(deleteQuestion);
