/**
 * Tariffe modello — versione semplice.
 *
 * Non salviamo il costo sull'evento: salviamo i token reali e calcoliamo il costo
 * a lettura, qui. Per cambiare un prezzo si modifica UN numero in questo file.
 *
 * Prezzi in USD per 1.000.000 di token. Aggiornare quando Google cambia il listino.
 * (Valori indicativi — verificare sul listino Vertex AI corrente.)
 */
export type ModelRate = {
  inputPerMillion: number;
  outputPerMillion: number;
};

export const MODEL_RATES: Record<string, ModelRate> = {
  "gemini-3-flash-preview": { inputPerMillion: 0.3, outputPerMillion: 2.5 },
  "gemini-3.1-flash-lite": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  "gemini-embedding-001": { inputPerMillion: 0.15, outputPerMillion: 0 },
};

/** Tariffa di fallback per modelli non ancora mappati (così non si rompe nulla). */
const DEFAULT_RATE: ModelRate = { inputPerMillion: 0, outputPerMillion: 0 };

export const getModelRate = (model: string): ModelRate =>
  MODEL_RATES[model] ?? DEFAULT_RATE;

/** Costo in USD di una singola chiamata, dai token reali. */
export const computeCostUsd = (
  model: string,
  inputTokens = 0,
  outputTokens = 0,
): number => {
  const rate = getModelRate(model);
  const cost =
    (inputTokens / 1_000_000) * rate.inputPerMillion +
    (outputTokens / 1_000_000) * rate.outputPerMillion;
  return Number(cost.toFixed(6));
};
