import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { Question } from "../../models/schemas/question.schema";

const getQuestionsBatch = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const questionIds = Array.isArray(body) ? body : body.questionIds;

  if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
    throw createError.BadRequest("A non-empty array of questionIds is required");
  }

  await connectDatabase();

  const objectIds = questionIds.map((id: string) => new Types.ObjectId(id));
  const questions = await Question.find({ _id: { $in: objectIds } }).lean();

  return questions;
};

export const handler = lambdaRequest(getQuestionsBatch);
