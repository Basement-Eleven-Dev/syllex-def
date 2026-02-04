import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";
import { lambdaRequest } from "../_helpers/_lambda/lambdaProxyResponse";
import createError from 'http-errors'


const getStatus = async (event: APIGatewayProxyEvent, context: Context) => {
    const status: boolean = Math.random() < 0.5;
    if (!status) throw new createError.ServiceUnavailable('Offline')
    return {
        status: "All Operating",
        currentUser: context.user
    };
}
export const handler = lambdaRequest(getStatus)