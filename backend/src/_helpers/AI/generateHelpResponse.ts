import { getGeminiClient } from "./getClient";
import { retrieveRelevantSyllexKnowledge } from "./embeddings/retrieveRelevantSyllexKnowledge";
import { buildHelpAgent } from "./buildHelpAgent";

/**
 * Generatore di risposte per la chat di assistenza Syllex.
 * Questa funzione è stateless: la cronologia viene passata dal frontend.
 */
export async function generateHelpResponseGemini(
  query: string,
  history: { role: string; content: string }[],
  userRole: "student" | "teacher"
) {
  try {
    const ai = await getGeminiClient();

    // 1. RAG: Recupero dei frammenti rilevanti dal manuale globale
    const relevantChunks = await retrieveRelevantSyllexKnowledge(query, userRole);
    const contextString = relevantChunks
      .map((item) => item.text)
      .join("\n\n---\n\n");

    console.log(`RAG Help: Estratto contesto di ${relevantChunks.length} frammenti.`);

    // 2. Costruzione del System Prompt (Help Agent)
    const systemPrompt = await buildHelpAgent(
      contextString,
      history,
      userRole
    );

    // 3. Generazione Risposta con Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Usiamo l'ultimo modello flash per velocità
      contents: [
        {
          role: "user",
          parts: [{ text: query }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Più basso per maggiore precisione tecnica
      },
    });

    return (
      response.text || "Mi dispiace, non sono riuscito a generare una risposta al momento."
    );
  } catch (error) {
    console.error("Errore nella generazione risposta Help Chat:", error);
    throw error;
  }
}
