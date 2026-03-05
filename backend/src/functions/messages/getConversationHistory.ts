import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { buildConversationHistory } from "../../_helpers/DB/messages/buildConversationHistory";

const getConversationHistory = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const subjectId = context.subjectId;
  const userId = context.user?._id;

  console.log(
    "recuperando conversazione per subjectId:",
    subjectId,
    "e userId:",
    context.user?._id,
  );

  const keepForDashboard = true;
  const conversationHistory = await buildConversationHistory(
    subjectId!,
    userId!,
    keepForDashboard,
  );
  return {
    success: true,
    conversationHistory,
  };
};

export const handler = lambdaRequest(getConversationHistory);
