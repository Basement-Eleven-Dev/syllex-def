import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Survey } from "../../../models/schemas/survey.schema";

const getSurveys = async (request: APIGatewayProxyEvent, context: Context) => {
  await connectDatabase();

  const surveys = await Survey.find({}).sort({ createdAt: -1 }).lean();

  return {
    success: true,
    surveys
  };
};

export const handler = lambdaRequest(getSurveys);
