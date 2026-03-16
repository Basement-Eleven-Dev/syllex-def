import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase, mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../env";
import createHttpError from "http-errors";

const updateEmail = async (request: APIGatewayProxyEvent, context: Context) => {
  const user = context.user!;

  const body = JSON.parse(request.body || "{}");
  const { email } = body;

  if (!email || typeof email !== "string") {
    throw createHttpError.BadRequest('Email required')
  }

  const db = await getDefaultDatabase();

  try {
    const result = await db
      .collection("users")
      .updateOne(
        { _id: user._id },
        {
          $set: {
            username: email,
            updatedAt: new Date(),
          },
        },
      );

    if (result.matchedCount === 0) {
      throw createHttpError.NotFound('User not found')
    }

    return {
      success: true,
      message: "Email aggiornata con successo",
    };
  } catch (error: any) {
    console.error("Errore durante l'aggiornamento dell'email:", error);
    throw createHttpError.InternalServerError("Errore durante l'aggiornamento dell'email")
  }
};

export const handler = lambdaRequest(updateEmail);
