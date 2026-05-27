import { APIGatewayProxyEvent, Context } from "aws-lambda";
import * as crypto from "crypto";
import { connectDatabase } from "../../_helpers/getDatabase";
import { lambdaPublicRequest } from "../../_helpers/lambdaProxyResponse";
import { User } from "../../models/schemas/user.schema";
import { PasswordResetToken } from "../../models/schemas/password-reset-token.schema";
import { sendEmail } from "../../_helpers/email/sendEmail";
import { forgotPasswordEmail } from "../../_helpers/email/emailTemplates";
import createError from "http-errors";

const CODE_VALIDITY_SECONDS = 15 * 60; // 15 minutes

const forgotPassword = async (
  event: APIGatewayProxyEvent,
  _context: Context,
) => {
  await connectDatabase();

  const body = JSON.parse(event.body || "{}");
  const email: string = (body.email || "").trim().toLowerCase();

  if (!email) throw createError.BadRequest("Email obbligatoria");

  // Always return the same response to avoid revealing if an email is registered
  const successResponse = {
    success: true,
    message: "Se l'email è registrata riceverai un codice a breve",
    codeValiditySeconds: CODE_VALIDITY_SECONDS,
  };

  const user = await User.findOne({ email });
  if (!user) return successResponse;

  // Generate a cryptographically random 6-digit code
  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  const expiresAt = new Date(Date.now() + CODE_VALIDITY_SECONDS * 1000);

  // Delete any existing unused tokens for this email
  await PasswordResetToken.deleteMany({ email });

  await PasswordResetToken.create({ email, codeHash, expiresAt, used: false });

  const { subject, html } = forgotPasswordEmail(code);
  await sendEmail(user.email, subject, html, "send");

  return successResponse;
};

export const handler = lambdaPublicRequest(forgotPassword);
