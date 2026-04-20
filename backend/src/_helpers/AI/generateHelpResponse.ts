import { getGeminiClient } from "./getClient";
import { retrieveRelevantSyllexKnowledge } from "./embeddings/retrieveRelevantSyllexKnowledge";
import { buildHelpAgent } from "./buildHelpAgent";
import { getSitemapForRole } from "./helpSitemap";

/**
 * Generatore di risposte per la chat di assistenza Syllex.
 * Questa funzione è stateless: la cronologia viene passata dal frontend.
 */
export async function generateHelpResponseGemini(
  query: string,
  history: { role: string; content: string }[],
  userRole: "student" | "teacher" | "admin",
  currentPath?: string
): Promise<{
  content: string;
  suggestedAction: { type: string; path: string; label: string } | null;
}> {
  try {
    const ai = await getGeminiClient();

    // 1. RAG: Recupero dei frammenti rilevanti dal manuale globale
    const relevantChunks = await retrieveRelevantSyllexKnowledge(
      query, 
      userRole === 'admin' ? 'teacher' : userRole
    );
    const contextString = relevantChunks
      .map((item) => item.text)
      .join("\n\n---\n\n");

    console.log(`RAG Help: Estratto contesto di ${relevantChunks.length} frammenti.`);

    // 2. Costruzione del System Prompt (Help Agent)
    const systemPrompt = await buildHelpAgent(
      contextString,
      history,
      userRole,
      currentPath
    );

    // 3. Generazione Risposta con Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: query }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1, // Più basso per maggiore precisione tecnica
      },
    });

    let text = response.text || "Mi dispiace, non sono riuscito a generare una risposta al momento.";
    let suggestedAction = null;

    // Estrazione del tag [NAVIGATE:KEY]
    const navigateMatch = text.match(/\[NAVIGATE:(\w+)\]/);
    if (navigateMatch) {
      const key = navigateMatch[1];
      const sitemap = getSitemapForRole(userRole);
      const page = sitemap.find(p => p.key === key);
      
      if (page && page.path !== currentPath) {
        suggestedAction = {
          type: 'NAVIGATE',
          path: page.path,
          label: page.label
        };
      }
      
      // Pulizia del testo dal tag
      text = text.replace(/\[NAVIGATE:\w+\]/g, '').trim();
    }

    return {
      content: text,
      suggestedAction
    };
  } catch (error) {
    console.error("Errore nella generazione risposta Help Chat:", error);
    throw error;
  }
}
