import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { Types, mongo } from "mongoose";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";


const getProfile = async (request: APIGatewayProxyEvent, context: Context) => {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      message: "Utente non trovato nel database",
    };
  }

  // Trasforma organizationIds (array) in organizationId (singolare) per compatibilità col frontend
  const organizationId =
    (user as any).organizationIds?.[0] || (user as any).organizationId;

  // Aggiungi l'email dal context (che contiene il token Cognito decodificato)
  const userWithEmail = {
    ...user,
    organizationId,
    email: context.user?.email || user.email,
  };

  console.log("[Profile] User recuperato:", userWithEmail);
  return userWithEmail;
};

export const handler = lambdaRequest(getProfile);
