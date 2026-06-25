import { Types } from "mongoose";
import { connectDatabase } from "../../getDatabase";
import { Message } from "../../../models/schemas/message.schema";

/**
 * Persiste un messaggio della chat (testo o voce).
 *
 * Due scelte deliberate:
 * 1. Il `timestamp` è catturato SUBITO, prima di qualsiasi `await`: garantisce
 *    l'ordine cronologico corretto. (Prima veniva assegnato all'insert, DOPO la
 *    generazione AI del titolo: i messaggi utente, rallentati da quella, finivano
 *    con un timestamp posteriore agli AI → in voce l'ordine si scombinava
 *    sistematicamente, tutti gli AI sopra e gli utente sotto.)
 * 2. Nessuna generazione AI del titolo qui dentro: bloccava il salvataggio per
 *    secondi/decine di secondi (la `messages/save` arrivava a 30s+) e costava una
 *    chiamata Gemini per ogni conversazione. La sidebar (listConversations) usa
 *    già come fallback il primo messaggio troncato → titolo immediato e gratuito.
 */
export async function saveMessage(
  subjectId: Types.ObjectId,
  userId: Types.ObjectId,
  role: "user" | "agent",
  content: string,
  inputType: "text" | "voice" = "text",
  conversationId: string,
) {
  const timestamp = new Date();

  await connectDatabase();

  const message = {
    subjectId,
    userId,
    conversationId,
    role,
    content,
    inputType,
    timestamp,
  };
  const result = await Message.insertOne(message);
  return result._id;
}
