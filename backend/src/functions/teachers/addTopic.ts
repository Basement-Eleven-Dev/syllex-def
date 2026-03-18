import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Topic } from "../../models/schemas/topic.schema";

const addTopic = async (request: APIGatewayProxyEvent, context: Context) => {
  try {
    const subjectId = new mongo.ObjectId(request.pathParameters!.subjectId!);
    const body = JSON.parse(request.body || "{}");
    const name = body.name?.trim();

    if (!name) {
      throw createError(400, "Il nome del topic è richiesto");
    }

    await connectDatabase();

    let result = await Topic.insertOne({
      name,
      subjectId,
    });

    return {
      success: true,
      topic: {
        _id: result._id,
        name,
      },
    };
  } catch (error) {
    console.error("Error adding topic:", error);
    throw createError(500, "Errore interno del server");
  }
};

export const handler = lambdaRequest(addTopic);
