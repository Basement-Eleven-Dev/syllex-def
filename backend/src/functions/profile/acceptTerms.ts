import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { User } from "../../models/schemas/user.schema";
import { TERMS_VERSION } from "../../_helpers/termsVersion";

const acceptTerms = async (request: APIGatewayProxyEvent, context: Context) => {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("Utente non trovato nel database");
  }

  await connectDatabase();

  // La versione autoritativa è quella mostrata dal frontend (= ciò che l'utente
  // ha effettivamente accettato). TERMS_VERSION resta solo come fallback difensivo
  // se il body non la porta, per non salvare un valore vuoto.
  const body = JSON.parse(request.body || "{}");
  const version =
    typeof body.version === "string" && body.version.trim()
      ? body.version.trim()
      : TERMS_VERSION;

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        termsAcceptation: {
          accepted: true,
          timestamp: new Date(),
          version,
        },
      },
    },
  );

  return {
    success: true,
    message: "Termini accettati con successo",
  };
};

export const handler = lambdaRequest(acceptTerms);
