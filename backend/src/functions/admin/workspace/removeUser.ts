import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { Types, mongo } from "mongoose";
import createError from "http-errors";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { User } from "../../../models/schemas/user.schema";

const remomeUser = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const { organizationId, userId } = request.pathParameters || {};

  if (!organizationId || !userId) {
    throw createError.BadRequest("Missing organizationId or userId");
  }

  await connectDatabase();

  const result = await User.updateOne(
    { _id: new mongo.ObjectId(userId) },
    {
      $pull: { organizationIds: organizationId } as any,
    }
  );

  // Also handle the legacy single organizationId if it matches
  await User.updateOne(
    { _id: new mongo.ObjectId(userId), organizationId: organizationId },
    { $unset: { organizationId: "" } }
  );

  if (result.matchedCount === 0) {
    throw createError.NotFound("User not found");
  }

  return { message: "User removed from organization successfully" }
}

export const handler = lambdaRequest(remomeUser);
