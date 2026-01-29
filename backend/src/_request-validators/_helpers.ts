import {
    APIGatewayTokenAuthorizerEvent,
    APIGatewayAuthorizerResult,
    Context
} from 'aws-lambda';
import { CognitoJwtVerifier } from "aws-jwt-verify";

export const checkValidation = async (event: APIGatewayTokenAuthorizerEvent, cognitoGroup?: 'students' | 'teachers'): Promise<APIGatewayAuthorizerResult> => {
    const verifier = CognitoJwtVerifier.create({
        userPoolId: process.env.COGNITO_POOL_ID!,
        tokenUse: "id", // Use "access" if you are sending the access token
        clientId: process.env.COGNITO_CLIENT_ID!,
    });
    const token = event.authorizationToken.split(' ')[1];
    if (!token) {
        return generatePolicy('anonymous', 'Deny', event.methodArn);
    }

    try {
        // 2. This checks the signature against the public JWKS 
        // and verifies expiration/audience/issuer.
        const payload = await verifier.verify(token);
        if (cognitoGroup) {
            if (payload['cognito:groups']?.includes(cognitoGroup)) return generatePolicy(payload.sub, 'Allow', event.methodArn, payload);
            else return generatePolicy('unauthorized', 'Deny', event.methodArn);
        }
        // 3. If successful, allow access
        return generatePolicy(payload.sub, 'Allow', event.methodArn, payload);

    } catch (err) {
        console.error("Token verification failed:", err);
        return generatePolicy('unauthorized', 'Deny', event.methodArn);
    }
}

const generatePolicy = (
    principalId: string,
    effect: 'Allow' | 'Deny',
    resource: string,
    contextData?: any
): APIGatewayAuthorizerResult => {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        // The 'context' object only supports flat Key-Value pairs (strings, numbers, booleans)
        context: contextData ? {
            email: contextData.email,
            sub: contextData.sub,
            groups: JSON.stringify(contextData['cognito:groups'] || []),
        } : undefined,
    };
};