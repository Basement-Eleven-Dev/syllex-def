import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  Context,
} from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoIdTokenPayload } from "aws-jwt-verify/jwt-model";
/**
 * Returns CognitoIdTokenPayload if authorized, null if not
 * @param token
 * @param cognitoGroup
 * @returns
 */
export const canInvoke = async (
  token?: string,
  cognitoGroup?: "students" | "teachers",
): Promise<CognitoIdTokenPayload | null> => {
  console.log(token, cognitoGroup);
  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_POOL_ID!,
    tokenUse: "id", // Use "access" if you are sending the access token
    clientId: process.env.COGNITO_CLIENT_ID!,
  });
  if (!token) return null;
  try {
    // 2. This checks the signature against the public JWKS
    // and verifies expiration/audience/issuer.
    const payload = await verifier.verify(token);
    console.log("✅ Token Verified:", payload);
    if (cognitoGroup) {
      if (payload["cognito:groups"]?.includes(cognitoGroup)) return payload;
      else return null;
    }
    // 3. If successful, allow access
    return payload;
  } catch (err) {
    console.error("❌ Authorization Error:", err);
    return null;
  }
};

export const checkValidation = async (
  event: APIGatewayTokenAuthorizerEvent,
  cognitoGroup?: "students" | "teachers",
): Promise<APIGatewayAuthorizerResult> => {
  const token = event.authorizationToken.split(" ")[1];
  const authorizedPayload = await canInvoke(token, cognitoGroup);
  return !authorizedPayload
    ? generatePolicy("unauthorized", "Deny", event.methodArn)
    : generatePolicy(
        authorizedPayload.sub,
        "Allow",
        event.methodArn,
        authorizedPayload,
      );
};

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  contextData?: any,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    // The 'context' object only supports flat Key-Value pairs (strings, numbers, booleans)
    context: contextData
      ? {
          email: contextData.email,
          sub: contextData.sub,
          groups: JSON.stringify(contextData["cognito:groups"] || []),
        }
      : undefined,
  };
};
