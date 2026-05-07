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
    { $group: { 
        _id: "$conversationId", 
        firstMessage: { $first: "$content" },
        lastMessage: { $last: "$content" },
        timestamp: { $last: "$timestamp" }
      } 
    },
    { $sort: { timestamp: -1 } }
  ]);

  return conversations.map(c => ({
    id: c._id,
    title: c.firstMessage,
    preview: c.lastMessage,
    timestamp: c.timestamp
  }));
};

export const handler = lambdaRequest(listConversations);
