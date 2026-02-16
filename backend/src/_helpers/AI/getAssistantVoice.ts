import { ObjectId } from "mongodb";
import { getDefaultDatabase } from "../getDatabase";

export async function getAssistantVoice(
  assistanId: string,
): Promise<string | null> {
  const db = await getDefaultDatabase();
  const assistant = await db
    .collection("assistants")
    .findOne({ _id: new ObjectId(assistanId) });
  if (!assistant) {
    return null;
  }

  return getVoiceName(assistant.voice);
}

const getVoiceName = (voiceId: string) => {
  if (voiceId === "neutral") return "alloy"; // Neutra e bilanciata
  if (voiceId === "energetic") return "nova"; // Energica e chiara (La migliore per l'italiano)
  if (voiceId === "clear") return "shimmer"; // Chiara e cristallina (Ottima alternativa a 'clara')
  if (voiceId === "deep") return "onyx"; // Profonda e autoritaria (Ottima alternativa a 'dario')
  return "alloy"; // Fallback di sicurezza
};
