import { ObjectId } from "bson";
import { getDefaultDatabase } from "../getDatabase";
import { getSubjectById } from "../DB/subjects/getSubjectById";

export async function buildReceptionist(
  assistantId: string,
  context: string,
  messagesHistory: { role: string; content: string }[],
) {
  const db = await getDefaultDatabase();
  const messagesContext = messagesHistory
    .map(
      (msg) =>
        `${msg.role === "user" ? "Utente" : "Assistente"}: ${msg.content}`,
    )
    .join("\n");
  const assistant = await db
    .collection("assistants")
    .findOne({ _id: new ObjectId(assistantId) });
  if (!assistant) {
    throw new Error("Assistant not found");
  }
  const { tone, voice, subjectId, name } = assistant;
  const subject = await getSubjectById(subjectId);

  const systemPrompt = `Sei un assistente di aiuto per un docente in una scuola. 
    Il tuo nome è ${name}, il tuo tono è ${tone} e la tua voce è ${voice}. 
    Stai aiutando un docente con la sua materia ${subject.name}. 
    Questo è il contesto che ti viene fornito: ${context}. 

    Rispondi sempre nella lingua in cui ti viene posta la domanda e non rispondere a domande che non sono pertinenti al contesto fornito.`;
  return systemPrompt;
}
