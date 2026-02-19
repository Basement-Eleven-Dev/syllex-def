import { ObjectId } from "mongodb";
import { getDefaultDatabase } from "../../getDatabase";
import { _ } from "inquirer/dist/commonjs/ui/prompt";

export async function buildConversationHistory(
  subjectId: ObjectId,
  userId: ObjectId,
  keepForDashboard: boolean = false,
) {
  const db = await getDefaultDatabase();
  const messages = await db
    .collection("messages")
    .find({ subjectId: subjectId, userId: userId })
    .sort({ timestamp: 1 })
    .toArray();

  if (keepForDashboard) {
    return messages.map((msg) => ({
      _id: msg._id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      audioUrl: msg.audioUrl || null,
    }));
  }
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
