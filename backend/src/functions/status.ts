import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";
import { lambdaRequest } from "../_helpers/lambdaProxyResponse";
import createError from 'http-errors'

//free logic
const getStatus = async (request: APIGatewayProxyEvent, context: Context) => {
    const status: boolean = Math.random() < 0.5;
    const currentUser = context.user;
    if (!status) throw new createError.ServiceUnavailable('Offline')
    return {
        message: "All Operating",
        currentUser: currentUser
    };
}

//Lambda Syntax that runs on api call
export const handler = lambdaRequest(getStatus)