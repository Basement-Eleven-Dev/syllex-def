import { getGeminiClient } from "./getClient";

export async function correctStudentQuestion(
  answer: string,
  maxScore: number,
  correctAnswer: string,
  language: string = "it",
): Promise<{ score: number; explanation: string; aiProbability: number }> {
  console.log(maxScore, "lo score massimo");

  if (!answer || answer.trim() === "") {
    answer = "Lo studente non ha fornito una risposta.";
  }

  const languageNames: Record<string, string> = {
    it: "italiano",
    en: "inglese",
    es: "spagnolo",
    fr: "francese",
    de: "tedesco",
  };
  const targetLanguage = languageNames[language] || language;

  const prompt = `Correggi la seguente risposta alla domanda.
La risposta corretta è: "${correctAnswer}".
La risposta dello studente è: "${answer}".

Assegna un punteggio da 0 a ${maxScore} in base alla correttezza della risposta
e fornisci una breve spiegazione.

IMPORTANTE: Fornisci la spiegazione sintetica ("spiegazione") esclusivamente in lingua ${targetLanguage}.

Stima la probabilità (0-100) che il testo sia generato da un'IA. 
Analizza la risposta. Sii molto cauto nell'assegnare probabilità elevate. Se trovi analogie creative, termini colloquiali o lievi imperfezioni sintattiche, abbassa drasticamente la probabilità AI (sotto il 30%). Considera 'Alta Probabilità' (sopra il 70%) solo se il testo è eccessivamente formale, strutturato con elenchi puntati perfetti e privo di qualsiasi 'colore' individuale.

IMPORTANTE: Rispondi SOLO con un oggetto JSON valido nel seguente formato, senza testo aggiuntivo:
{"punteggio": <numero da 0 a ${maxScore}>, "spiegazione": "<breve spiegazione in lingua ${targetLanguage}>", "aiProbability": <numero da 0 a 100>}`;

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
        systemInstruction: `Sei un docente esperto che corregge le risposte degli studenti. Scrivi la spiegazione del voto nella lingua: ${targetLanguage}. Rispondi sempre e solo con JSON valido.`,
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
      aiProbability:
        typeof parsed.aiProbability === "number" ? parsed.aiProbability : 0,
    };
  } catch (error) {
    console.error("Errore nella correzione con Gemini:", error);
    return {
      score: 0,
      explanation: "Errore durante la correzione automatica.",
      aiProbability: 0,
    };
  }
}
