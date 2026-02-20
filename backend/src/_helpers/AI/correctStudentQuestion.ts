import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "./getOpenAIClient";
import { z } from "zod";
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
  const OutputFormat = z.object({
    punteggio: z.number(),
    spiegazione: z.string(),
  });
  const prompt = `
Correggi la seguente risposta alla domanda.
La risposta corretta è: "${correctAnswer}".
La risposta dello studente è: "${answer}".

Assegna un punteggio da 0 a ${maxScore} in base alla correttezza della risposta
e fornisci una breve spiegazione.
`;

  const response = await openai.responses.parse({
    model: "gpt-4o",
    messages: [{ role: "system", content: prompt }],
    temperature: 0,
    text: {
      format: zodTextFormat(OutputFormat, "correction_type")
    }
  });

  const parsed = response.output_parsed;


  return {
    score: parsed?.punteggio || 0,
    explanation: parsed?.spiegazione || "",
  };
}
