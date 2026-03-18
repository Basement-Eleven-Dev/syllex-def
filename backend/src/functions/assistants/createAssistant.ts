import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Assistant } from "../../models/schemas/assistant.schema";

const createAssistant = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  // Parse and validate request body
  const body = JSON.parse(request.body || "{}");
  console.log(body, "il corpo della richiesta");

  if (!body.agent) {
    throw createError(400, "I dati dell'assistente sono richiesti");
  }

  if (!context.subjectId) {
    throw createError(400, "subjectId è richiesto");
  }

  const teacherId = context.user?._id;

  // Get database connection
  await connectDatabase();
  const { name, tone, voice, _id } = body.agent;
  // Prepare material data
  const assistant = {
    _id,
    name,
    tone,
    voice,
    createdAt: new Date(),
    teacherId,
    subjectId: context.subjectId,
  };
  delete assistant._id;

  const insertResult = await Assistant.insertOne(assistant);
  assistant._id = insertResult._id;

  return {
    success: true,
    assistantId: assistant._id.toString(),
  };
};

export const handler = lambdaRequest(createAssistant);
