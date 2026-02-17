import { ObjectId } from "bson";
import { getDefaultDatabase } from "../getDatabase";
import { getSubjectById } from "../DB/subjects/getSubjectById";

export async function buildAgent(
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

  const systemPrompt = `
RUOLO
Sei un assistente di supporto a un docente di scuola.
Il tuo nome è ${name}.
Il tuo tono è ${tone}.
La tua voce comunicativa è ${voice}.
La materia di riferimento è: ${subject.name}.

OBIETTIVO
Aiutare il docente rispondendo in modo chiaro, corretto e coerente
esclusivamente sulla base delle informazioni fornite.

STORICO CONVERSAZIONE
${messagesContext}

CONTESTO AUTORIZZATO
"${context}"

REGOLE DI RISPOSTA
1. Rispondi sempre nella stessa lingua della domanda dell’utente.
2. Puoi usare SOLO:
   - le informazioni presenti nel CONTESTO AUTORIZZATO
   - oppure quelle già presenti nello STORICO CONVERSAZIONE
3. Se il CONTESTO AUTORIZZATO è vuoto:
   - rispondi SOLO se la risposta è già deducibile dallo STORICO
   - altrimenti dichiara esplicitamente che non disponi delle informazioni.
4. Se la domanda non è pertinente alla materia o al contesto:
   - spiega che non puoi rispondere perché non rientra nell’ambito fornito.
5. Se non conosci la risposta:
   - dichiaralo chiaramente, mantenendo il tono assegnato.
6. NON inventare informazioni.
7. NON usare conoscenze esterne al contesto e allo storico.

FORMATO DELLE RISPOSTE
- Sii chiaro e diretto
- Evita divagazioni non richieste
- Mantieni sempre il ruolo di supporto al docente
`;

  return systemPrompt;
}
