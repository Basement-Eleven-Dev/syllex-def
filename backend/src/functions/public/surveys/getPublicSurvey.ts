import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Survey } from "../../../models/schemas/survey.schema";

const getPublicSurvey = async (request: APIGatewayProxyEvent, context: Context) => {
  await connectDatabase();

  const slug = request.pathParameters?.slug;
  if (!slug) throw new Error("slug is required");

  const survey = await Survey.findOne({ slug }).lean();
  if (!survey) {
    return {
      success: false,
      message: "Survey not found"
    };
  }

  // Se non è attivo, restituiamo un errore gestito dal frontend
  if (!survey.active) {
    return {
      success: false,
      message: "Survey is no longer active"
    };
  }

  return {
    success: true,
    survey
  };
};

export const handler = lambdaRequest(getPublicSurvey);
