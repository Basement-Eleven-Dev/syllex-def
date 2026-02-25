import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { ObjectId } from "mongodb";
import createError from "http-errors";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";

export const handler = lambdaRequest(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { organizationId, userId } = event.pathParameters || {};

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

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User removed from organization successfully" }),
    };
  }
);
