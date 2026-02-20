import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const renameTopic = async (request: APIGatewayProxyEvent, context: Context) => {
  const subjectId = new ObjectId(request.pathParameters!.subjectId!);
  const topicId = new ObjectId(request.pathParameters!.topicId!);
  const body = JSON.parse(request.body || "{}");
  const name = body.name?.trim();

  if (!name) {
    throw createError(400, "Il nuovo nome del topic è richiesto");
  }

  try {
    let db = await getDefaultDatabase();
    let topicsCollection = db.collection("topics");

    let result = await topicsCollection.updateOne(
      { _id: topicId, subjectId },
      { $set: { name } },
    );

    if (result.matchedCount === 0) {
      throw createError(404, "Topic non trovato");
    }

    return {
      success: true,
      renamed: result.modifiedCount > 0,
    };
  } catch (error) {
    console.error("Error renaming topic:", error);
    throw createError(500, "Errore interno del server");
  }
};

export const handler = lambdaRequest(renameTopic);
