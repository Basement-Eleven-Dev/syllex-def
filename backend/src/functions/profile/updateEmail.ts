import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { mongoClient } from "../../_helpers/getDatabase";
import { DB_NAME } from "../../env";

const updateEmail = async (request: APIGatewayProxyEvent, context: Context) => {
  const user = context.user;

  if (!user) {
    return {
      statusCode: 401,
      body: { message: "Utente non autenticato" },
    };
  }

  const body = JSON.parse(request.body || "{}");
  const { email } = body;

  if (!email || typeof email !== "string") {
    return {
      statusCode: 400,
      body: { message: "Email non valida" },
    };
  }

  const client = await mongoClient();

  try {
    const result = await client
      .db(DB_NAME)
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
      return {
        statusCode: 404,
        body: { message: "Utente non trovato" },
      };
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        message: "Email aggiornata con successo",
      },
    };
  } catch (error: any) {
    console.error("Errore durante l'aggiornamento dell'email:", error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: "Errore durante l'aggiornamento dell'email",
      },
    };
  }
};

export const handler = lambdaRequest(updateEmail);
