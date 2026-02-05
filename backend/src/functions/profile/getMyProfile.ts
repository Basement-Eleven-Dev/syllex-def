import { APIGatewayProxyEvent } from "aws-lambda";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";


export interface User {
  _id: ObjectId;
  username: string;
  firstName?: string;
  lastName?: string;
  role: "teacher" | "student" | "admin";
  organizationIds?: ObjectId[];
}


const getProfile = async (request: APIGatewayProxyEvent) => {
  return (await getCurrentUser(request)) || { message: "Utente non trovato nel database" };
}


export const handler = lambdaRequest(getProfile)