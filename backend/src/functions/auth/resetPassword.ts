import { APIGatewayProxyEvent, Context } from "aws-lambda";
import * as crypto from "crypto";
import {
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { connectDatabase } from "../../_helpers/getDatabase";
import { lambdaPublicRequest } from "../../_helpers/lambdaProxyResponse";
import { PasswordResetToken } from "../../models/schemas/password-reset-token.schema";
import createError from "http-errors";

const cognitoClient = new CognitoIdentityProviderClient({
  region: "eu-south-1",
});

const resetPassword = async (
  event: APIGatewayProxyEvent,
  _context: Context,
) => {
  await connectDatabase();

  const body = JSON.parse(event.body || "{}");
  const email: string = (body.email || "").trim().toLowerCase();
  const code: string = (body.code || "").trim();
  const newPassword: string = body.newPassword || "";

  if (!email || !code || !newPassword) {
    throw createError.BadRequest(
      "Email, codice e nuova password sono obbligatori",
    );
  }

  const token = await PasswordResetToken.findOne({ email, used: false });

  if (!token) throw createError.BadRequest("Codice non valido o scaduto");
  if (token.expiresAt < new Date())
    throw createError.BadRequest("Codice scaduto");

  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  if (codeHash !== token.codeHash)
    throw createError.BadRequest("Codice non valido");

  const userPoolId = process.env.COGNITO_POOL_ID;
  if (!userPoolId) throw new Error("COGNITO_POOL_ID not configured");

  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: newPassword,
      Permanent: true,
    }),
  );

  token.used = true;
  await token.save();

  return { success: true, message: "Password aggiornata con successo" };
};

export const handler = lambdaPublicRequest(resetPassword);
