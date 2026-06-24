import { getGeminiClient } from "./getClient";
import { trackedGenerateContent } from "./trackedGeneration";

export async function generateConversationTitleGemini(query: string): Promise<string> {
  try {
    const ai = await getGeminiClient();
    const prompt = `Genera un titolo riassuntivo estremamente sintetico (massimo 4 parole) in italiano per descrivere l'argomento principale di questa richiesta: "${query}". Rispondi SOLO con il titolo, senza virgolette, senza punteggiatura, e capitalizza la prima lettera.`;
    
    const response = await trackedGenerateContent(ai, {
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }, "ai.conversation_title");

    let text: string | undefined;
    try {
      if (response.text) text = response.text;
    } catch {}

    if (!text) {
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        const textParts = parts
          .filter((p: any) => p.text && !p.thought)
          .map((p: any) => p.text);
        if (textParts.length > 0) text = textParts.join("");
      }
    }

    return text ? text.trim().replace(/["']/g, "") : "";
  } catch (error) {
    console.error("Errore generazione titolo:", error);
    return "";
  }
}

export async function generateConversationSummaryTitle(
  messages: { role: string; content: string }[]
): Promise<string> {
  try {
    const ai = await getGeminiClient();
    const userPrompts = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n- ");
      
    const prompt = `Genera un titolo riassuntivo estremamente sintetico (massimo 4 parole) in italiano che rappresenti l'argomento principale di questi messaggi dell'utente in una chat didattica:\n- ${userPrompts}\n\nRispondi SOLO con il titolo, senza virgolette, senza punteggiatura, e capitalizza la prima lettera.`;
    
    const response = await trackedGenerateContent(ai, {
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }, "ai.conversation_title");

    let text: string | undefined;
    try {
      if (response.text) text = response.text;
    } catch {}

    if (!text) {
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        const textParts = parts
          .filter((p: any) => p.text && !p.thought)
          .map((p: any) => p.text);
        if (textParts.length > 0) text = textParts.join("");
      }
    }

    return text ? text.trim().replace(/["']/g, "") : "";
  } catch (error) {
    console.error("Errore generazione titolo riassuntivo:", error);
    return "";
  }
}
