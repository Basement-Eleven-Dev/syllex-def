import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Question } from "../../models/schemas/question.schema";

const getQuestionById = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const questionId = request.pathParameters?.questionId;

  if (!questionId) {
    throw createError.BadRequest("questionId is required");
  }

  await connectDatabase();

  const question = await Question.findById(questionId).lean();

  if (!question) {
    throw createError.NotFound("Question not found");
  }

  return question;
};

export const handler = lambdaRequest(getQuestionById);
