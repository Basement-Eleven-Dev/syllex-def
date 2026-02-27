import { getGeminiClient } from "./getClient";

export async function correctStudentQuestion(
  answer: string,
  maxScore: number,
  correctAnswer: string,
): Promise<{ score: number; explanation: string }> {
  console.log(maxScore, "lo score massimo");

  if (!answer || answer.trim() === "") {
    answer = "Lo studente non ha fornito una risposta.";
  }

  const prompt = `Correggi la seguente risposta alla domanda.
La risposta corretta è: "${correctAnswer}".
La risposta dello studente è: "${answer}".

Assegna un punteggio da 0 a ${maxScore} in base alla correttezza della risposta
e fornisci una breve spiegazione.

IMPORTANTE: Rispondi SOLO con un oggetto JSON valido nel seguente formato, senza testo aggiuntivo:
{"punteggio": <numero da 0 a ${maxScore}>, "spiegazione": "<breve spiegazione>"}`;

  try {
    const ai = await getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        systemInstruction: "Sei un docente esperto che corregge le risposte degli studenti. Rispondi sempre e solo con JSON valido.",
        temperature: 0,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    console.log("Gemini correction response:", text);

    const parsed = JSON.parse(text);

    return {
      score: typeof parsed.punteggio === "number" ? parsed.punteggio : 0,
      explanation: parsed.spiegazione || "",
    };
  } catch (error) {
    console.error("Errore nella correzione con Gemini:", error);
    return {
      score: 0,
      explanation: "Errore durante la correzione automatica.",
    };
  }
}
