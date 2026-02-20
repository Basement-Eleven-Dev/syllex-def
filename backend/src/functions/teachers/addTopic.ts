import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const addTopic = async (request: APIGatewayProxyEvent, context: Context) => {
  try {
    const subjectId = new ObjectId(request.pathParameters!.subjectId!);
    const body = JSON.parse(request.body || "{}");
    const name = body.name?.trim();

    if (!name) {
      throw createError(400, "Il nome del topic è richiesto");
    }

    let db = await getDefaultDatabase();
    let topicsCollection = db.collection("topics");

    let result = await topicsCollection.insertOne({
      name,
      subjectId,
    });

    return {
      success: true,
      topic: {
        _id: result.insertedId,
        name,
      },
    };
  } catch (error) {
    console.error("Error adding topic:", error);
    throw createError(500, "Errore interno del server");
  }
};

export const handler = lambdaRequest(addTopic);
