import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { SurveyResponse } from "../../../models/schemas/survey-response.schema";

const getSurveyResponses = async (request: APIGatewayProxyEvent, context: Context) => {
  await connectDatabase();

  const surveyId = request.pathParameters?.surveyId;
  if (!surveyId) throw new Error("surveyId is required");

  const responses = await SurveyResponse.find({ surveyId }).populate('respondentId', 'name email').sort({ createdAt: -1 }).lean();

  return {
    success: true,
    responses
  };
};

export const handler = lambdaRequest(getSurveyResponses);
