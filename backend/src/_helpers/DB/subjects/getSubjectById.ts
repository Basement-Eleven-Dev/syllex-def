import { ObjectId } from "mongodb";
import { getDefaultDatabase } from "../../getDatabase";

export async function getSubjectById(subjectId: string) {
  const db = await getDefaultDatabase();
  const subject = await db
    .collection("subjects")
    .findOne({ _id: new ObjectId(subjectId) });
  if (!subject) {
    throw new Error("Subject not found");
  }
  return subject;
}
