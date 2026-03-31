import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { generateDeterministicPassword } from "../../_helpers/cognito/userManagement";

const getDeterministicPassword = async (
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

  const { email } = request.pathParameters as { email: string };

  if (!email) {
    throw createError.BadRequest("Email is required");
  }

  const password = generateDeterministicPassword(email);

  return {
    email,
    password,
  };
};

export const handler = lambdaRequest(getDeterministicPassword);
