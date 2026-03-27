import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { User } from "../../models/schemas/user.schema";
import { PRIVACY_VERSION } from "../../_helpers/privacyVersion";

const acceptPolicies = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("Utente non trovato nel database");
  }

  await connectDatabase();

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        privacyPolicyAccepted: true,
        aiPolicyAccepted: true,
        privacyAcceptation: {
          accepted: true,
          timestamp: new Date(),
          version: PRIVACY_VERSION,
        },
      },
    },
  );

  return {
    success: true,
    message: "Politiche accettate con successo",
  };
};

export const handler = lambdaRequest(acceptPolicies);
