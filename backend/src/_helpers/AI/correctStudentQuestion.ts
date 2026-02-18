import { getOpenAIClient } from "./getOpenAIClient";

export async function correctStudentQuestion(
  answer: string,
  maxScore: number,
  correctAnswer: string,
): Promise<{ score: number; explanation: string }> {
  const openai = await getOpenAIClient();
  console.log(maxScore, "lo score massimo");

  if (!answer || answer.trim() === "") {
    answer = "Lo studente non ha fornito una risposta.";
  }

  const prompt = `
Correggi la seguente risposta alla domanda.
La risposta corretta è: "${correctAnswer}".
La risposta dello studente è: "${answer}".

Assegna un punteggio da 0 a ${maxScore} in base alla correttezza della risposta
e fornisci una breve spiegazione.

Rispondi ESCLUSIVAMENTE in JSON valido.
Niente markdown, niente backtick.
Formato:
{"score": number, "explanation": string}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: prompt }],
    temperature: 0,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Risposta vuota dal modello");
  }

  // 🔧 NORMALIZZAZIONE ANTI-MARKDOWN
  const cleaned = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Errore nel parsing della risposta JSON: ${cleaned}`);
  }

  if (
    typeof parsed.score !== "number" ||
    typeof parsed.explanation !== "string"
  ) {
    throw new Error(`Formato JSON non valido: ${cleaned}`);
  }

  // clamp di sicurezza
  const score = Math.min(Math.max(parsed.score, 0), maxScore);

  return {
    score,
    explanation: parsed.explanation,
  };
}
