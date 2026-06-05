import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Survey } from "../../../models/schemas/survey.schema";

const getSurveyById = async (request: APIGatewayProxyEvent, context: Context) => {
  await connectDatabase();

  const surveyId = request.pathParameters?.surveyId;
  if (!surveyId) throw new Error("surveyId is required");

  const survey = await Survey.findById(surveyId).lean();
  if (!survey) throw new Error("Survey not found");

  return {
    success: true,
    survey
  };
};

export const handler = lambdaRequest(getSurveyById);
