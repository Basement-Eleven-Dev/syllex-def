import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { connection } from "mongoose";
import { lambdaPublicRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import createHttpError from "http-errors";

const sendError = async (request: APIGatewayProxyEvent, context: Context) => {
    throw createHttpError.BadRequest("This is a test error for health check");
};

export const handler = lambdaPublicRequest(sendError);