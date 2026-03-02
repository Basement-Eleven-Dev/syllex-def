import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

export interface User {
  _id: ObjectId;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: "teacher" | "student" | "admin";
  organizationIds?: ObjectId[];
}

const getProfile = async (request: APIGatewayProxyEvent, context: Context) => {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      message: "Utente non trovato nel database",
    };
  }

  // Aggiungi l'email dal context (che contiene il token Cognito decodificato)
  return {
    ...user,
    email: context.user?.email || user.email,
  };
};

export const handler = lambdaRequest(getProfile);
