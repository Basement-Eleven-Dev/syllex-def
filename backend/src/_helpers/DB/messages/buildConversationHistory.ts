import { connectDatabase } from "../../getDatabase";
import { Message } from "../../../models/schemas/message.schema";
import { Types } from "mongoose";

export async function buildConversationHistory(
  subjectId: Types.ObjectId,
  userId: Types.ObjectId,
  keepForDashboard: boolean = false,
) {
  await connectDatabase();
  const messages = await Message.find({ subjectId: subjectId, userId: userId }).sort({ timestamp: 1 })

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
