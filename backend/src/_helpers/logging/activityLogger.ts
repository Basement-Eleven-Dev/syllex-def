import { connectDatabase } from "../getDatabase";
import { ActivityLog } from "../../models/schemas/activity-log.schema";
import { RequestContextStore } from "./requestContext";

export type HttpLogInfo = {
  action: string;
  route?: string;
  httpMethod?: string;
  functionName?: string;
  startedAt: Date;
  durationMs: number;
  status: "success" | "error";
  httpStatusCode?: number;
  errorType?: string;
  errorMessage?: string;
  rateLimited?: boolean;
  userAgent?: string;
  appVersion?: string;
  stage?: string;
};

/**
 * Scarica a DB l'evento HTTP della richiesta + tutti gli eventi AI bufferizzati,
 * in un'unica insertMany. Da chiamare a fine richiesta (handler concluso).
 *
 * Resiliente per costruzione: qualunque errore qui dentro viene assorbito —
 * il logging non deve MAI rompere o rallentare la risposta all'utente.
 */
export const flushRequestLog = async (
  store: RequestContextStore | undefined,
  http: HttpLogInfo,
): Promise<void> => {
  try {
    const shared = {
      userId: store?.userId,
      userEmail: store?.userEmail,
      userRole: store?.userRole,
      organizationId: store?.organizationId,
      subjectId: store?.subjectId,
      traceId: store?.traceId,
      requestId: store?.requestId,
      stage: http.stage,
    };

    const httpDoc = {
      ...shared,
      category: "http" as const,
      action: http.action,
      route: http.route,
      httpMethod: http.httpMethod,
      functionName: http.functionName,
      startedAt: http.startedAt,
      durationMs: http.durationMs,
      status: http.status,
      httpStatusCode: http.httpStatusCode,
      errorType: http.errorType,
      errorMessage: http.errorMessage,
      rateLimited: http.rateLimited,
      userAgent: http.userAgent,
      appVersion: http.appVersion,
    };

    // L'endpoint /telemetry è solo un trasporto: gli eventi "client" che porta
    // sono già scritti da recordTelemetry. Non logghiamo la sua riga http (rumore).
    const isTelemetry =
      http.route === "telemetry" || http.route === "/telemetry";

    const aiDocs = (store?.aiEvents ?? []).map((e) => ({
      ...shared,
      category: "ai" as const,
      action: e.action,
      model: e.model,
      modality: e.modality,
      inputTokens: e.inputTokens,
      outputTokens: e.outputTokens,
      cachedTokens: e.cachedTokens,
      totalTokens: e.totalTokens,
      startedAt: e.startedAt,
      durationMs: e.durationMs,
      status: e.status,
      rateLimited: e.rateLimited,
      retryCount: e.retryCount,
      errorType: e.errorType,
      errorMessage: e.errorMessage,
      promptContent: e.promptContent,
      responseContent: e.responseContent,
      finishReason: e.finishReason,
    }));

    const docs = isTelemetry ? aiDocs : [httpDoc, ...aiDocs];
    if (docs.length === 0) return;

    await connectDatabase();
    await ActivityLog.insertMany(docs, { ordered: false });
  } catch (err) {
    // Mai propagare: il log è best-effort.
    console.error("[activityLogger] flush fallito:", err);
  }
};
