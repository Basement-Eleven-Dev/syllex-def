import { Types } from "mongoose";
import { connectDatabase } from "../../getDatabase";
import { Message } from "../../../models/schemas/message.schema";

export async function saveMessage(
  subjectId: Types.ObjectId,
  userId: Types.ObjectId,
  role: "user" | "agent",
  content: string,
) {
  await connectDatabase();
  const message = {
    subjectId: subjectId,
    userId: userId,
    role,
    content,
    timestamp: new Date(),
  };
  const result = await Message.insertOne(message);
  return result._id;
}
