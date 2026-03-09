import {
    APIGatewayTokenAuthorizerEvent,
    APIGatewayAuthorizerResult,
    Context
} from 'aws-lambda';
import { checkValidation } from './_helpers';


export const handler = async (
    event: APIGatewayTokenAuthorizerEvent,
    context: Context
): Promise<APIGatewayAuthorizerResult> => {
    const policy = await checkValidation(event, 'teachers')
    console.log(JSON.stringify(policy))
    return policy
};