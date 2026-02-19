import { ObjectId } from "mongodb";
import { getDefaultDatabase } from "../../getDatabase";

export async function saveMessage(
  subjectId: ObjectId,
  userId: ObjectId,
  role: "user" | "agent",
  content: string,
) {
  const db = await getDefaultDatabase();
  const message = {
    subjectId: subjectId,
    userId: new ObjectId(userId),
    role,
    content,
    timestamp: new Date(),
  };
  const result = await db.collection("messages").insertOne(message);
  return result.insertedId.toString();
}
