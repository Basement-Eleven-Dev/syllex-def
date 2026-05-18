import { Types } from "mongoose";

export async function getAssistantVoice(
  _subjectId: Types.ObjectId,
): Promise<string | undefined> {
  return "alloy";
}
