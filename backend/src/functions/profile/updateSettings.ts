import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { Types, mongo } from "mongoose";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { User } from "../../models/schemas/user.schema";

const updateSettings = async (request: APIGatewayProxyEvent, context: Context) => {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("Utente non trovato nel database");
  }

  const { notificationSettings } = JSON.parse(request.body || "{}");

  if (!notificationSettings) {
    throw new Error("Impostazioni mancanti");
  }

  await connectDatabase();

  await User.updateOne(
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
