import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { Question } from "../../models/schemas/question.schema";

const deleteQuestion = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const questionId = request.pathParameters?.questionId;

  if (!questionId) {
    throw createError.BadRequest("questionId is required");
  }

  await connectDatabase();

  const result = await Question.deleteOne({
    _id: questionId,
    teacherId: context.user?._id,
  } as any);

  if (result.deletedCount === 0) {
    throw createError.NotFound("Question not found or not authorized");
  }

  return { deleted: true };
};

export const handler = lambdaRequest(deleteQuestion);
