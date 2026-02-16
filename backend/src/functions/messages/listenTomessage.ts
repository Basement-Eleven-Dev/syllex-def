import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { generateAndUploadAudio } from "../../_helpers/whisper/generateAudio";
import { getAssistantVoice } from "../../_helpers/AI/getAssistantVoice";

const listenToMessage = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { messageId, text, assistantId } = body;
  const voice = await getAssistantVoice(assistantId);

  const audioUrl = await generateAndUploadAudio(text, messageId);

  const db = await getDefaultDatabase();
  await db
    .collection("messages")
    .updateOne({ _id: new ObjectId(messageId) }, { $set: { audioUrl } });

  return {
    success: true,
    audioUrl,
  };
};

export const handler = lambdaRequest(listenToMessage);
