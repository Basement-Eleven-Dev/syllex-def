import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getQuestionById = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const questionId = request.pathParameters?.questionId;

  if (!questionId) {
    throw createError.BadRequest("questionId is required");
  }

  const db = await getDefaultDatabase();
  const questionsCollection = db.collection("questions");

  const question = await questionsCollection.findOne({
    _id: new ObjectId(questionId),
  });

  if (!question) {
    throw createError.NotFound("Question not found");
  }

  return question;
};

export const handler = lambdaRequest(getQuestionById);
