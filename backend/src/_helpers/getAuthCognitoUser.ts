import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { ObjectId } from "mongodb";
import { mongoClient } from "./getDatabase";
import { DB_NAME } from "../env";
import { User } from "../models/user";

export type LoggedUserClaims = {
  sub: string;
  "cognito:groups": string | null | undefined;
  email_verified: string;
  iss: string;
  "cognito:username": string;
  origin_jti: string;
  aud: string;
  event_id: string;
  token_use: string;
  auth_time: string;
  exp: string;
  iat: string;
  jti: string;
  email: string;
};

const retrieveCognitoUserFromIdToken = (
  token?: string
): LoggedUserClaims | undefined => {
  if (!token) return undefined;
  const [, payload] = token.split(".");
  if (!payload) return undefined;
  try {
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decoded) as LoggedUserClaims;
  } catch {
    return undefined;
  }
};

export const getAuthCognitoUser = (
  event: APIGatewayProxyEvent
): LoggedUserClaims | undefined => {
  let claims: LoggedUserClaims | undefined = event.requestContext.authorizer
    ?.claims as LoggedUserClaims | undefined;
  if (!claims)
    claims = retrieveCognitoUserFromIdToken(event.headers.Authorization);
  return claims;
};


export const getCurrentUser = async (
  request: APIGatewayProxyEvent
): Promise<User | null> => {
  const client = await mongoClient();

  let forcedUserId = request.headers["User-Id"];
  if (forcedUserId)
    return (await client
      .db(DB_NAME)
      .collection("users")
      .findOne({ cognitoId: forcedUserId })) as User;
  if (!forcedUserId) {
    try {
      const decodedToken = getAuthCognitoUser(request);
      if (!decodedToken) return null;
      const user = await client
        .db(DB_NAME)
        .collection("users")
        .findOne({ cognitoId: decodedToken.sub });
      console.log("LOGGER", user);
      return user as User | null;
    } catch (error) {
      return null;
    }
  } else {
    console.log("LOGGER", forcedUserId);
    return null;
  }
};
