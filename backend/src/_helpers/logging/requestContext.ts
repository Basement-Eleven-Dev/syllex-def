import { AsyncLocalStorage } from "async_hooks";
import { Types } from "mongoose";

/**
 * Un singolo evento AI raccolto durante una richiesta (token reali di una chiamata Gemini).
 * Viene bufferizzato qui e scaricato a fine richiesta in un'unica insertMany.
 */
export type AiUsageEvent = {
  action: string;
  model: string;
  modality: "text" | "audio" | "image" | "embedding";
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  status: "success" | "error";
  rateLimited?: boolean;
  retryCount?: number;
  errorType?: string;
  errorMessage?: string;
  startedAt: Date;
};

/**
 * Contesto di richiesta propagato automaticamente (senza toccare le firme delle funzioni)
 * dal middleware in `lambdaRequest` fino in fondo, incluse le chiamate AI.
 */
export type RequestContextStore = {
  traceId: string;
  requestId?: string;
  startedAt: Date;
  userId?: Types.ObjectId;
  userEmail?: string;
  userRole?: string;
  organizationId?: Types.ObjectId;
  subjectId?: Types.ObjectId;
  // Buffer degli eventi AI accumulati durante la richiesta.
  aiEvents: AiUsageEvent[];
};

const storage = new AsyncLocalStorage<RequestContextStore>();

/**
 * Esegue `fn` dentro un contesto di richiesta isolato.
 * Usa storage.run (non enterWith) per essere robusto in concorrenza: ogni
 * invocazione ha il suo store, che sopravvive a tutti gli await interni
 * (incluse le chiamate AI lunghe) senza venire calpestato da richieste parallele.
 */
export const runWithRequestContext = <T>(
  store: RequestContextStore,
  fn: () => T,
): T => storage.run(store, fn);

/** Ritorna il contesto attivo, se presente. */
export const getRequestContext = (): RequestContextStore | undefined =>
  storage.getStore();

/** Registra un evento AI nel buffer della richiesta corrente (no-op fuori dal contesto). */
export const pushAiEvent = (event: AiUsageEvent): void => {
  const store = storage.getStore();
  if (store) store.aiEvents.push(event);
};
