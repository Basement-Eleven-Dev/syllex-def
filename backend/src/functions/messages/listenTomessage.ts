import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { generateAndUploadAudio } from "../../_helpers/whisper/generateAudio";
import { getAssistantVoice } from "../../_helpers/AI/getAssistantVoice";
import { Message } from "../../models/schemas/message.schema";

const listenToMessage = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const { text } = JSON.parse(request.body || "{}");
  const messageId = request.pathParameters!.messageId! as string;
  const voice = await getAssistantVoice(context.subjectId!);

  let audioUrl;
  if (voice) {
    audioUrl = await generateAndUploadAudio(text, messageId, voice);
  } else {
    audioUrl = await generateAndUploadAudio(text, messageId);
  }

  await connectDatabase();
  await Message
    .updateOne({ _id: new mongo.ObjectId(messageId) }, { $set: { audioUrl } });

  return {
    success: true,
    audioUrl,
  };
};

export const handler = lambdaRequest(listenToMessage);
