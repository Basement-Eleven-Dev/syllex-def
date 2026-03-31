import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { Question } from "../../models/schemas/question.schema";

//free logic
const getStatus = async (request: APIGatewayProxyEvent, context: Context) => {
  const question = JSON.parse(request.body || "{}");

  await connectDatabase();

  question.topicId = new Types.ObjectId(question.topicId);
  question.teacherId = context.user?._id;
  question.subjectId = context.subjectId;
  question.createdAt = new Date();
  question.updatedAt = new Date();

  const result = await Question.create(question);
  question._id = result._id;

  return {
    question: question,
  };
};

//Lambda Syntax that runs on api call
export const handler = lambdaRequest(getStatus);
