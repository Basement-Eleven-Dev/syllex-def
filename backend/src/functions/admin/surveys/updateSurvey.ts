import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Survey } from "../../../models/schemas/survey.schema";

const updateSurvey = async (request: APIGatewayProxyEvent, context: Context) => {
  await connectDatabase();

  const surveyId = request.pathParameters?.surveyId;
  if (!surveyId) throw new Error("surveyId is required");

  if (!request.body) throw new Error("Body is required");
  const data = JSON.parse(request.body);

  const survey = await Survey.findByIdAndUpdate(surveyId, data, { new: true });
  if (!survey) throw new Error("Survey not found");

  return {
    success: true,
    survey
  };
};

export const handler = lambdaRequest(updateSurvey);
