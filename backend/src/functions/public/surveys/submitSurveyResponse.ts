import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Survey } from "../../../models/schemas/survey.schema";
import { SurveyResponse } from "../../../models/schemas/survey-response.schema";
import { getCurrentUser } from "../../../_helpers/getAuthCognitoUser";

const submitSurveyResponse = async (request: APIGatewayProxyEvent, context: Context) => {
  await connectDatabase();

  const slug = request.pathParameters?.slug;
  if (!slug) throw new Error("slug is required");

  if (!request.body) throw new Error("Body is required");
  const data = JSON.parse(request.body);

  const survey = await Survey.findOne({ slug });
  if (!survey) throw new Error("Survey not found");
  if (!survey.active) throw new Error("Survey is not active");

  let respondentId = undefined;
  if (!survey.isAnonymous) {
      // Validate token
      const authUser = await getCurrentUser(request);
      if (!authUser) throw new Error("Authorization required for this survey or invalid token");
      
      respondentId = authUser._id;
  }

  const response = new SurveyResponse({
      surveyId: survey._id,
      respondentId: respondentId,
      answers: data.answers
  });

  await response.save();

  return {
    success: true,
    response
  };
};

export const handler = lambdaRequest(submitSurveyResponse);
