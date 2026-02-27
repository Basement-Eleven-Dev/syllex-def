import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

//free logic
const getStatus = async (request: APIGatewayProxyEvent, context: Context) => {
  const question = JSON.parse(request.body || "{}");

  const db = await getDefaultDatabase();
  const questionsCollection = db.collection("questions");

  question.topicId = new ObjectId(question.topicId);
  question.teacherId = context.user?._id;
  question.subjectId = context.subjectId;
  question.createdAt = new Date();
  question.updatedAt = new Date();

  question._id = (await questionsCollection.insertOne(question)).insertedId;

  return {
    question: question,
  };
};

//Lambda Syntax that runs on api call
export const handler = lambdaRequest(getStatus);
