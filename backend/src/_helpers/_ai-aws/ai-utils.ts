/**
 * Estrae un blocco di codice JSON da una stringa di testo, anche se è
 * circondato da altro testo o formattazione (es. ```json ... ```).
 * @param text La stringa di testo grezza ricevuta dal modello AI.
 * @returns L'oggetto JavaScript parsato se un JSON valido viene trovato, altrimenti null.
 */
export function extractJsonFromResponse(text: string): any | null {
  if (!text) {
    return null;
  }

  // Cerca un blocco JSON {...} o [...] all'interno della stringa.
  // Questa regex è più flessibile e gestisce oggetti e array.
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

  if (jsonMatch && jsonMatch[0]) {
    try {
      // Prova a fare il parsing del blocco JSON trovato.
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Se il parsing fallisce, significa che il blocco non era un JSON valido.
      console.error("[AI Utils] Errore nel parsing del JSON estratto:", error);
      return null;
    }
  }

  // Se non viene trovato nessun blocco JSON.
  console.warn("[AI Utils] Nessun blocco JSON trovato nella risposta.");
  return null;
}

/**
 *  Mette in pausa l'esecuzione per un numero specificato di millisecondi.
 * @param ms Il numero di millisecondi da attendere.
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
