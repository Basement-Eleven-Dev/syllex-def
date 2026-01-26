import { APIGatewayProxyEvent } from "aws-lambda";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  generateLambdaResponse,
  Res,
} from "../_helpers/_types/lambdaProxyResponse";
import { getCurrentUser } from "../_helpers/getAuthCognitoUser";
import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  username: string;
  firstName?: string;
  lastName?: string;
  role: "teacher" | "student" | "admin";
  organizationIds?: ObjectId[];
}

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res
        .status(404)
        .json({ message: "Utente non trovato nel database" });
    }
    return generateLambdaResponse({
      statusCode: 200,
      body: JSON.stringify(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Errore del server durante il recupero del profilo",
      error: error instanceof Error ? error.message : "Errore in getMyProfile",
    });
  }
};
