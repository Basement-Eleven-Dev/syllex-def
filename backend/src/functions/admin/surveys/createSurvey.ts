import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Survey } from "../../../models/schemas/survey.schema";

const createSurvey = async (request: APIGatewayProxyEvent, context: Context) => {
  await connectDatabase();
  
  if (!request.body) throw new Error("Body is required");
  const data = JSON.parse(request.body);

  const survey = new Survey(data);
  await survey.save();

  return {
    success: true,
    survey
  };
};

export const handler = lambdaRequest(createSurvey);
