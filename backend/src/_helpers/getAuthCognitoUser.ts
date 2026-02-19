import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { ObjectId } from "mongodb";
import { mongoClient } from "./getDatabase";
import { DB_NAME } from "../env";
import { User } from "../models/user";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoIdTokenPayload } from "aws-jwt-verify/jwt-model";

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
  token?: string,
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

export const getAuthCognitoUser = async (
  token: string,
): Promise<CognitoIdTokenPayload | undefined> => {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_POOL_ID!,
    tokenUse: "id", // Use "access" if you are sending the access token
    clientId: process.env.COGNITO_CLIENT_ID!,
  });
  try {
    // 2. This checks the signature against the public JWKS
    // and verifies expiration/audience/issuer.
    const payload = await verifier.verify(token);
    return payload;
  } catch (err) {
    return undefined;
  }
};

export const getCurrentUser = async (
  request: APIGatewayProxyEvent,
): Promise<User | null> => {
  const client = await mongoClient();
  try {
    const token = (request.headers.authorization || request.headers.Authorization)?.split(" ")[1];
    if (!token) return null;
    const decodedToken = await getAuthCognitoUser(token);
    if (!decodedToken) return null;
    const user = await client
      .db(DB_NAME)
      .collection("users")
      .findOne({ cognitoId: decodedToken.sub });
    return user as User | null;
  } catch (error) {
    return null;
  }
};
