import { z } from "zod";
import { askStructuredLLM } from "./simpleCompletion";

const TopicDiscoverySchema = z.object({
  suggestedTopics: z.array(z.string()).describe("A list of new, relevant topics found in the text that are not present in the existing topics list."),
});

/**
 * Uses an LLM to suggest new topics for a subject based on extracted text from a material.
 * @param text The extracted text from the material.
 * @param existingTopics The list of topics already associated with the subject.
 * @param subjectName The name of the subject.
 * @returns A list of suggested new topics.
 */
export async function suggestNewTopics(
  text: string,
  existingTopics: string[],
  subjectName: string
): Promise<string[]> {
  const prompt = `
    Sei un assistente didattico esperto. Analizza il seguente testo estratto da un materiale didattico per la materia "${subjectName}".
    
    Argomenti già esistenti per questa materia:
    ${existingTopics.length > 0 ? existingTopics.join(", ") : "Nessuno"}
    
    Il tuo compito è identificare al massimo 3-5 nuovi argomenti chiave, concetti o temi trattati nel testo che NON sono già presenti nella lista degli argomenti esistenti.
    Restituisca solo argomenti realmente rilevanti, molto concisi (1-2 parole al massimo ciascuno).
    
    Testo del materiale:
    ${text.substring(0, 50000)} // Limita il testo per evitare problemi di context window se necessario
  `;

  try {
    const result = await askStructuredLLM(prompt, [], TopicDiscoverySchema);
    // Filtra eventuali duplicati o argomenti troppo simili se necessario
    return result.suggestedTopics.filter(topic => 
      !existingTopics.some(existing => existing.toLowerCase() === topic.toLowerCase())
    );
  } catch (error) {
    console.error("Error suggesting new topics:", error);
    return [];
  }
}
