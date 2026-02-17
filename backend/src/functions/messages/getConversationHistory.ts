import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { buildConversationHistory } from "../../_helpers/DB/messages/buildConversationHistory";

const getConversationHistory = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const subjectId = context.subjectId;

  console.log(
    "recuperando conversazione per subjectId:",
    subjectId,
    "e userId:",
    context.user?._id,
  );

  const keepForDashboard = true;
  const conversationHistory = await buildConversationHistory(
    subjectId,
    context.user?._id.toString() || "",
    keepForDashboard,
  );
  return {
    success: true,
    conversationHistory,
  };
};

export const handler = lambdaRequest(getConversationHistory);
