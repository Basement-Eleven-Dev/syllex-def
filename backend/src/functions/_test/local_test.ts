
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";

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