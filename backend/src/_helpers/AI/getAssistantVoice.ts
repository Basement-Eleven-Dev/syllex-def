import { connectDatabase } from "../getDatabase";
import { Assistant } from "../../models/schemas/assistant.schema";
import { Types } from "mongoose";

export async function getAssistantVoice(
  subjectId: Types.ObjectId,
): Promise<string | undefined> {
  await connectDatabase();
  const assistant = await Assistant.findOne({ subjectId: subjectId });
  if (!assistant) {
    return undefined;
  }

  return getVoiceName(assistant.voice);
}

const getVoiceName = (voiceId?: string | null) => {
  if (voiceId === "neutral") return "alloy"; // Neutra e bilanciata
  if (voiceId === "energetic") return "nova"; // Energica e chiara (La migliore per l'italiano)
  if (voiceId === "clear") return "shimmer"; // Chiara e cristallina (Ottima alternativa a 'clara')
  if (voiceId === "deep") return "onyx"; // Profonda e autoritaria (Ottima alternativa a 'dario')
  return "alloy"; // Fallback di sicurezza
};
