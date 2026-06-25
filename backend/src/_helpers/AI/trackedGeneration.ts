import { GoogleGenAI } from "@google/genai";
import { pushAiEvent } from "../logging/requestContext";

// Limite per campo di contenuto loggato: tiene i documenti pesanti fuori dal DB
// pur conservando l'intero prompt di istruzioni e la risposta nei casi normali.
const MAX_CONTENT_CHARS = 50_000;

const cap = (s: string): string =>
  s.length > MAX_CONTENT_CHARS
    ? s.slice(0, MAX_CONTENT_CHARS) +
      `\n…[troncato: ${s.length - MAX_CONTENT_CHARS} caratteri in più]`
    : s;

/**
 * Estrae SOLO il testo leggibile da `contents` Gemini, scartando di proposito
 * gli allegati (inlineData/fileData = documenti in base64, enormi e inutili qui).
 * Così cattura il prompt di sistema + le istruzioni dell'utente, non i materiali.
 */
const extractPromptText = (contents: unknown): string | undefined => {
  try {
    const texts: string[] = [];
    const walk = (node: any): void => {
      if (node == null) return;
      if (typeof node === "string") {
        texts.push(node);
        return;
      }
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (typeof node === "object") {
        if (typeof node.text === "string") texts.push(node.text);
        if (Array.isArray(node.parts)) node.parts.forEach(walk);
        // inlineData / fileData ignorati di proposito.
      }
    };
    walk(contents);
    const joined = texts.join("\n").trim();
    return joined ? cap(joined) : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Wrapper attorno alle chiamate Gemini: esegue la chiamata e registra i token reali
 * (da usageMetadata) nel buffer della richiesta. Sostituisce 1:1 i call site:
 *
 *   const response = await ai.models.generateContent({ ... });
 *   →  const response = await trackedGenerateContent(ai, { ... }, "azione");
 *
 * Best-effort sul logging: se manca il contesto o l'usageMetadata, la chiamata
 * funziona comunque normalmente.
 */
export const trackedGenerateContent = async (
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
  action: string,
): Promise<Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>> => {
  const startedAt = new Date();
  try {
    const response = await ai.models.generateContent(params);
    const u = response.usageMetadata;
    const responseText = String(response.text ?? "");
    pushAiEvent({
      action,
      model: String(params.model),
      modality: "text",
      inputTokens: u?.promptTokenCount,
      outputTokens: u?.candidatesTokenCount,
      cachedTokens: u?.cachedContentTokenCount,
      totalTokens: u?.totalTokenCount,
      durationMs: Date.now() - startedAt.getTime(),
      status: "success",
      startedAt,
      promptContent: extractPromptText(params.contents),
      responseContent: responseText ? cap(responseText) : undefined,
      finishReason: response.candidates?.[0]?.finishReason as
        | string
        | undefined,
    });
    return response;
  } catch (error: any) {
    pushAiEvent({
      action,
      model: String(params.model),
      modality: "text",
      durationMs: Date.now() - startedAt.getTime(),
      status: "error",
      rateLimited: error?.status === 429,
      errorType: error?.name,
      errorMessage: error?.message,
      startedAt,
      // Sulla risposta fallita non c'è output, ma il prompt resta utile
      // per indagare refusal/blocchi.
      promptContent: extractPromptText(params.contents),
    });
    throw error;
  }
};

/**
 * Variante per gli embedding. usageMetadata può non essere presente: in quel caso
 * registriamo comunque l'evento (token a 0) per avere il conteggio chiamate.
 */
export const trackedEmbedContent = async (
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["embedContent"]>[0],
  action: string,
): Promise<Awaited<ReturnType<GoogleGenAI["models"]["embedContent"]>>> => {
  const startedAt = new Date();
  try {
    const response = await ai.models.embedContent(params);
    const u: any = (response as any).usageMetadata;
    pushAiEvent({
      action,
      model: String(params.model),
      modality: "embedding",
      inputTokens: u?.promptTokenCount ?? u?.totalTokenCount,
      totalTokens: u?.totalTokenCount,
      durationMs: Date.now() - startedAt.getTime(),
      status: "success",
      startedAt,
    });
    return response;
  } catch (error: any) {
    pushAiEvent({
      action,
      model: String(params.model),
      modality: "embedding",
      durationMs: Date.now() - startedAt.getTime(),
      status: "error",
      rateLimited: error?.status === 429,
      errorType: error?.name,
      errorMessage: error?.message,
      startedAt,
    });
    throw error;
  }
};
