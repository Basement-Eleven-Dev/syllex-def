
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { extractPDFWithGoogleDocumentAI } from "../../_helpers/AI/exctractWithGeminiVision";

const runTest = async (
    event: APIGatewayProxyEvent,
    context: Context,
) => {
    const domain = event.requestContext.domainName;
    const path = event.requestContext.path;
    const prefix = process.env.LOCAL_TESTING ? 'http://' : 'https://'
    const fullUrl = prefix + domain + path;
    return fullUrl;
}

export const handler = lambdaRequest(runTest);