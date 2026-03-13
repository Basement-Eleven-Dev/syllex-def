import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

const updateSettings = async (request: APIGatewayProxyEvent, context: Context) => {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("Utente non trovato nel database");
  }

  const { notificationSettings } = JSON.parse(request.body || "{}");

  if (!notificationSettings) {
    throw new Error("Impostazioni mancanti");
  }

  const db = await getDefaultDatabase();
  const usersCollection = db.collection("users");

  await usersCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        notificationSettings: {
          newCommunication: !!notificationSettings.newCommunication,
          newEvent: !!notificationSettings.newEvent,
          newTest: !!notificationSettings.newTest,
          testCorrected: !!notificationSettings.testCorrected,
        },
      },
    }
  );

  return {
    success: true,
    message: "Impostazioni aggiornate con successo",
  };
};

export const handler = lambdaRequest(updateSettings);
