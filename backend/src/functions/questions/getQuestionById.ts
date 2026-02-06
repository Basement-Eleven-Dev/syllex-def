import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase, getSecret } from "../../_helpers/getDatabase";

//free logic
const getStatus = async (request: APIGatewayProxyEvent, context: Context) => {
  const questionId = request.pathParameters!.questionId!;
  if (!questionId) {
    throw createError.BadRequest("questionId is required");
  }
  const apiKey = getSecret("syllex_api_key_llm");
  const body = JSON.parse(request.body || "{}");
  const db = await getDefaultDatabase();
  const questionsCollection = db.collection("questions");

  const status: boolean = Math.random() < 0.5;
  const currentUser = context.user;
  if (!status) throw new createError.ServiceUnavailable("Offline");
  return {
    message: "All Operating",
    currentUser: currentUser,
  };
};

//Lambda Syntax that runs on api call
export const handler = lambdaRequest(getStatus);
