import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { ObjectId } from "mongodb";
import createError from "http-errors";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";

const remomeUser = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const { organizationId, userId } = request.pathParameters || {};

  if (!organizationId || !userId) {
    throw createError.BadRequest("Missing organizationId or userId");
  }

  const db = await getDefaultDatabase();

  const result = await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: { organizationIds: organizationId } as any,
    }
  );

  // Also handle the legacy single organizationId if it matches
  await db.collection("users").updateOne(
    { _id: new ObjectId(userId), organizationId: organizationId },
    { $unset: { organizationId: "" } }
  );

  if (result.matchedCount === 0) {
    throw createError.NotFound("User not found");
  }

  return { message: "User removed from organization successfully" }
}

export const handler = lambdaRequest(remomeUser);
