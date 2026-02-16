import { ObjectId } from "mongodb";
import { getDefaultDatabase } from "../getDatabase";

export async function associateFilesToAssistant(
  assistantId: string,
  fileIds: string[]
) {
  const db = await getDefaultDatabase();
  const collection = db.collection("assistants");

  await collection.updateOne(
    { _id: new ObjectId(assistantId) },
    {
      $addToSet: {
        associatedFileIds: { $each: fileIds.map(id => new ObjectId(id)) }
      }
    }
  );
}
