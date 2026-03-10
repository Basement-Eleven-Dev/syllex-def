import {
    APIGatewayTokenAuthorizerEvent,
    APIGatewayAuthorizerResult,
    Context
} from 'aws-lambda';
import { checkValidation } from './_validators';


export const handler = async (
    event: APIGatewayTokenAuthorizerEvent,
    context: Context
): Promise<APIGatewayAuthorizerResult> => {
    return await checkValidation(event, 'admins')
};