import { getGeminiClient } from "./getClient";
import { trackedGenerateContent } from "./trackedGeneration";

export async function correctStudentQuestion(
  answer: string,
  maxScore: number,
  correctAnswer: string,
  language: string = "it",
): Promise<{
  score: number;
  explanation: string;
  aiProbability: number;
  aiMarkers: string[];
}> {
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

Analizza attentamente lo stile di scrittura della risposta dello studente sotto tre profili linguistici:
1. Uniformità del ritmo (le frasi sono tutte della stessa lunghezza o perfettamente simmetriche?).
2. Uso ripetitivo di connettivi o transizioni standard tipiche dell'AI (es: "Tuttavia", "In conclusione", "Inoltre", "Pertanto", "È importante notare che").
3. Assenza completa di variazioni personali, espressioni colloquiali o micro-imperfezioni naturali (un testo troppo formale o asettico).

Se rilevi uno o più di questi pattern, stima una probabilità realistica di autorevolezza AI (0-100) basata sull'intensità di questi elementi e popola un array di brevi marker descrittivi in lingua ${targetLanguage} (es: per l'italiano "Stile sintattico estremamente uniforme", "Transizioni standard tipiche di AI", "Tono eccessivamente formale/neutro").
Se il testo contiene analogie creative individuali, termini gergali/colloquiali o lievi imperfezioni sintattiche umane, abbassa drasticamente la probabilità (sotto il 20-30%) e non aggiungere marker di segnalazione (lascia l'array vuoto). Sii molto cauto nell'indicare probabilità alte.

IMPORTANTE: Rispondi SOLO con un oggetto JSON valido nel seguente formato, senza testo aggiuntivo:
{
  "punteggio": <numero da 0 a ${maxScore}>,
  "spiegazione": "<breve spiegazione in lingua ${targetLanguage}>",
  "aiProbability": <numero da 0 a 100>,
  "aiMarkers": [<array di stringhe con i marker descrittivi o array vuoto>]
}`;

  try {
    const ai = await getGeminiClient();

    const response = await trackedGenerateContent(ai, {
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        systemInstruction: `Sei un docente esperto che corregge le risposte degli studenti e ne analizza lo stile di scrittura. Scrivi la spiegazione del voto e gli eventuali marker linguistici nella lingua: ${targetLanguage}. Rispondi sempre e solo con JSON valido.`,
        temperature: 0,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    }, "ai.correct_student_question");

    const text = response.text || "";
    console.log("Gemini correction response:", text);

    const parsed = JSON.parse(text);

    return {
      score: typeof parsed.punteggio === "number" ? parsed.punteggio : 0,
      explanation: parsed.spiegazione || "",
      aiProbability:
        typeof parsed.aiProbability === "number" ? parsed.aiProbability : 0,
      aiMarkers: Array.isArray(parsed.aiMarkers) ? parsed.aiMarkers : [],
    };
  } catch (error) {
    console.error("Errore nella correzione con Gemini:", error);
    return {
      score: 0,
      explanation: "Errore durante la correzione automatica.",
      aiProbability: 0,
      aiMarkers: [],
    };
  }
}
