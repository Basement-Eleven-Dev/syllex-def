import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSecret } from "../secrets/getSecret";

export async function extractWithGeminiVision(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  try {
    const gemini_api_key = await getSecret("gemini_api_key");
    if (!gemini_api_key) throw new Error("API Key mancante");

    const genAI = new GoogleGenerativeAI(gemini_api_key);

    // Prova con il nome esatto "gemini-1.5-flash"
    // Se fallisce, prova "gemini-1.5-flash-latest"
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const base64Data = buffer.toString("base64");

    const prompt = `Estrai tutto il testo leggibile da questo documento. Se ci sono tabelle usa il Markdown. Se ci sono immagini descrivile. Non aggiungere introduzioni.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("Risposta vuota da Gemini");

    return text;
  } catch (error: any) {
    // Se l'errore è un 404, logga i dettagli specifici
    console.error("Dettagli Errore Gemini:", error.message);
    if (error.status === 404) {
      console.error(
        "CONSIGLIO: Verifica che la API Key sia creata su Google AI Studio (non Vertex AI) e di aver fatto 'npm install @google/generative-ai@latest'",
      );
    }
    return "";
  }
}
