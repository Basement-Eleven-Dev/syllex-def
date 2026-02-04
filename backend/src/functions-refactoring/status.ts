import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";
import { lambdaRequest } from "../_helpers/_lambda/lambdaProxyResponse";
import createError from 'http-errors'


const getStatus = async (event: APIGatewayProxyEvent, context: Context) => {
    console.log(context.user);
    const status: boolean = Math.random() < 0.5;
    if (!status) throw new createError.ServiceUnavailable('Offline')
    return {
        status: "All Operating"
    };
}
export const handler = lambdaRequest(getStatus)