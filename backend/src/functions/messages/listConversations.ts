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

  // Conversazioni uniche per utente+materia. Ordiniamo per timestamp PRIMA del
  // group così $first/$last sono deterministici. Il titolo è il PRIMO messaggio
  // dell'utente (ciò che ha chiesto), non i vecchi titoli AI (ormai non più
  // generati) né eventuali saluti/risposte dell'assistente.
  const conversations = await Message.aggregate([
    { $match: { subjectId: subjectId, userId: userId } },
    { $sort: { timestamp: 1, _id: 1 } },
    {
      $group: {
        _id: "$conversationId",
        firstContent: { $first: "$content" },
        // Solo i contenuti dei messaggi UTENTE (troncati), null per gli altri
        userContents: {
          $push: {
            $cond: [
              { $eq: ["$role", "user"] },
              { $substrCP: ["$content", 0, 80] },
              null,
            ],
          },
        },
        lastMessage: { $last: "$content" },
        timestamp: { $last: "$timestamp" },
      },
    },
    { $sort: { timestamp: -1 } },
  ]);

  return conversations.map((c) => {
    const firstUserMessage = (c.userContents || []).find((x: string) => x);
    let title = (firstUserMessage || c.firstContent || "Nuova conversazione").trim();
    if (title.length > 40) {
      title = title.slice(0, 40) + "…";
    }

    return {
      id: c._id,
      title,
      preview: c.lastMessage,
      timestamp: c.timestamp,
    };
  });
};

export const handler = lambdaRequest(listConversations);
