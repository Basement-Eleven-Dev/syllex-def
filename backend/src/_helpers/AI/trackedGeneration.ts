import { GoogleGenAI } from "@google/genai";
import { pushAiEvent } from "../logging/requestContext";

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
