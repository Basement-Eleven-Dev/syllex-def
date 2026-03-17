import { Types } from "mongoose";
import { connectDatabase } from "../getDatabase";
import { Assistant } from "../../models/schemas/assistant.schema";

export async function associateFilesToAssistant(
  assistantId: Types.ObjectId,
  fileIds: Types.ObjectId[]
) {
  await connectDatabase();

  await Assistant.updateOne(
    { _id: assistantId },
    {
      $addToSet: {
        associatedFileIds: { $each: fileIds }
      }
    }
  );
}
