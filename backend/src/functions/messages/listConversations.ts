import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Message } from "../../models/schemas/message.schema";

const listConversations = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const subjectId = context.subjectId;
  const userId = context.user?._id;

  if (!subjectId || !userId) {
    return [];
  }

  await connectDatabase();

  // Troviamo tutte le conversazioni uniche per questo utente e materia
  const conversations = await Message.aggregate([
    { $match: { subjectId: subjectId, userId: userId } },
    {
      $group: {
        _id: "$conversationId",
        firstMessage: { $first: "$content" },
        conversationTitle: { $max: "$conversationTitle" },
        lastMessage: { $last: "$content" },
        timestamp: { $last: "$timestamp" },
      },
    },
    { $sort: { timestamp: -1 } },
  ]);

  return conversations.map((c) => {
    // Pulisce e tronca il titolo di fallback se è una vecchia chat senza riassunto
    let displayTitle = c.conversationTitle || c.firstMessage || "Nuova conversazione";
    if (!c.conversationTitle && displayTitle.length > 36) {
      displayTitle = displayTitle.slice(0, 35) + "...";
    }

    return {
      id: c._id,
      title: displayTitle,
      preview: c.lastMessage,
      timestamp: c.timestamp,
    };
  });
};

export const handler = lambdaRequest(listConversations);
