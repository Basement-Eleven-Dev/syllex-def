import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Message } from "../../models/schemas/message.schema";

const deleteConversation = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const conversationId = request.pathParameters?.messageId || request.pathParameters?.conversationId;
  const userId = context.user?._id;

  if (!conversationId || !userId) {
    return { success: false, message: "Missing conversationId or unauthorized" };
  }

  await connectDatabase();

  // Delete all messages belonging to this conversation and user to ensure security
  const result = await Message.deleteMany({
    conversationId: conversationId,
    userId: userId,
  });

  return { success: true, deletedCount: result.deletedCount };
};

export const handler = lambdaRequest(deleteConversation);
