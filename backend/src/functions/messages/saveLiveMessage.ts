import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { saveMessage } from "../../_helpers/DB/messages/saveMessage";

const saveLiveMessage = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const { role, content, conversationId, inputType } = body;
  const subjectId = context.subjectId;
  const userId = context.user?._id;

  if (!subjectId || !conversationId || !content || !role || !userId) {
    return { success: false, message: "Missing data or unauthorized" };
  }

  const insertId = await saveMessage(
    subjectId,
    userId as any,
    role,
    content,
    inputType || "voice",
    conversationId
  );

  return { success: true, _id: insertId };
};

export const handler = lambdaRequest(saveLiveMessage);
