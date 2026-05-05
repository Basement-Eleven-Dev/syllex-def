import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getSecret } from "../../_helpers/secrets/getSecret";
import { GoogleAuth } from "google-auth-library";

const generateGeminiToken = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const teacherId = context.user?._id;
  if (!teacherId) throw createError(401, "Non autorizzato");

  // Salva il file JSON del Service Account di Google Cloud nel tuo AWS Secret Manager
  const serviceAccountJsonStr = await getSecret("google_service_account_json");
  if (!serviceAccountJsonStr) throw createError(500, "Configurazione mancante");

  try {
    const credentials = JSON.parse(serviceAccountJsonStr);

    // Richiediamo un token OAuth a Google
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    return {
      success: true,
      token: tokenResponse.token, // Questo è l'Access Token OAuth temporaneo
      expiresIn: tokenResponse.res?.data?.expires_in,
    };
  } catch (error) {
    console.error("Errore generazione OAuth Token:", error);
    throw createError(500, "Impossibile generare il token di accesso");
  }
};

export const handler = lambdaRequest(generateGeminiToken);
