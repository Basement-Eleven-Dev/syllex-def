import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { sendBulkEmail } from "../../_helpers/email/sendEmail";

/**
 * Superadmin-only tool to send bulk emails to a provided list of recipients.
 * This is useful for manual communications or for testing the bulk email system.
 */
const sendBulkEmailTool = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const user = context.user;

  // Superadmin check: role === 'admin' AND no organizationId AND no organizationIds
  const isSuperAdmin = 
    user?.role === "admin" && 
    (!user.organizationIds || user.organizationIds.length === 0);

  if (!isSuperAdmin) {
    throw createError.Forbidden("Access denied. Superadmin only.");
  }

  const { subject, html, recipients } = JSON.parse(request.body || "{}") as {
    subject?: string;
    html?: string;
    recipients?: string[];
  };

  if (!subject || !html || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw createError.BadRequest("Subject, HTML content, and a non-empty recipients list are required.");
  }

  console.log(`[SuperAdminTool] Sending bulk email: "${subject}" to ${recipients.length} recipients.`);


  const sentCount = await sendBulkEmail({
    subject,
    html,
    recipients,
  });

  return {
    success: true,
    message: `Enqueued ${sentCount} messages for ${recipients.length} recipients.`,
    sentCount,
  };
};

export const handler = lambdaRequest(sendBulkEmailTool);
