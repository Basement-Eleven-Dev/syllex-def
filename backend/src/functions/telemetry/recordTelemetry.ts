import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { mongo } from "mongoose";
import createHttpError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { ActivityLog } from "../../models/schemas/activity-log.schema";

/**
 * POST /telemetry — ingestione della telemetria client (category "client").
 *
 * Cattura ciò che vive solo nel browser e non passa dall'HTTP applicativo:
 * apertura/download materiali, sessione vocale Gemini Live, navigazione.
 *
 * Principi (vedi PIANO-LOGGING.md):
 * - Solo metadati e riferimenti, MAI contenuto sensibile.
 * - Whitelist di azioni + sanitizzazione: un utente "logged" non puo' scrivere
 *   documenti arbitrari nella collection di audit.
 * - Best-effort: la telemetria non deve mai disturbare l'utente.
 */

// Azioni client accettate. Tutto il resto viene scartato.
const ALLOWED_ACTIONS = new Set<string>([
  "material.open",
  "material.download",
  "voice.session",
  "navigation",
]);

const MAX_EVENTS = 50; // tetto per richiesta (anti-abuso)
const MAX_PAYLOAD_KEYS = 12;
const MAX_STRING_LEN = 300;

type ClientEvent = {
  action?: string;
  startedAt?: string;
  durationMs?: number;
  payload?: Record<string, unknown>;
  materialId?: string;
  conversationId?: string;
  model?: string;
  modality?: string;
  inputTokens?: number;
  outputTokens?: number;
};

/**
 * Tiene solo valori primitivi (string/number/boolean), tronca le stringhe e
 * limita il numero di chiavi. Oggetti/array vengono ignorati: niente blob
 * potenzialmente sensibili nei log.
 */
const sanitizePayload = (
  raw: unknown,
): Record<string, unknown> | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, unknown> = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= MAX_PAYLOAD_KEYS) break;
    if (typeof v === "string") {
      out[k] = v.length > MAX_STRING_LEN ? v.slice(0, MAX_STRING_LEN) : v;
      n++;
    } else if (typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
      n++;
    }
  }
  return Object.keys(out).length ? out : undefined;
};

const toObjectId = (v?: string) =>
  v && mongo.ObjectId.isValid(v) ? new mongo.ObjectId(v) : undefined;

const toDate = (v?: string): Date => {
  if (v) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

const clampNumber = (v: unknown): number | undefined =>
  typeof v === "number" && isFinite(v) && v >= 0 ? v : undefined;

const recordTelemetry = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const user = context.user;
  if (!user) throw createHttpError(401, "Non autenticato");

  let body: any = {};
  try {
    body = request.body ? JSON.parse(request.body) : {};
  } catch {
    throw createHttpError(400, "Body non valido");
  }

  // Accetta sia { events: [...] } (batch) sia un singolo evento { action, ... }.
  const rawEvents: ClientEvent[] = Array.isArray(body.events)
    ? body.events
    : body.action
      ? [body as ClientEvent]
      : [];

  const events = rawEvents
    .filter(
      (e) =>
        e &&
        typeof e.action === "string" &&
        ALLOWED_ACTIONS.has(e.action),
    )
    .slice(0, MAX_EVENTS);

  if (events.length === 0) {
    return { success: true, recorded: 0 };
  }

  const headers = request.headers || {};
  const shared = {
    category: "client" as const,
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    organizationId: user.organizationIds?.[0],
    subjectId: context.subjectId,
    stage: process.env.STAGE,
    userAgent: headers["User-Agent"] || headers["user-agent"],
    appVersion: headers["X-App-Version"] || headers["x-app-version"],
  };

  const docs = events.map((e) => ({
    ...shared,
    action: e.action,
    startedAt: toDate(e.startedAt),
    durationMs: clampNumber(e.durationMs),
    payload: sanitizePayload(e.payload),
    materialId: toObjectId(e.materialId),
    conversationId:
      typeof e.conversationId === "string" ? e.conversationId : undefined,
    model: typeof e.model === "string" ? e.model : undefined,
    modality: typeof e.modality === "string" ? e.modality : undefined,
    inputTokens: clampNumber(e.inputTokens),
    outputTokens: clampNumber(e.outputTokens),
  }));

  await connectDatabase();
  await ActivityLog.insertMany(docs, { ordered: false });

  return { success: true, recorded: docs.length };
};

export const handler = lambdaRequest(recordTelemetry);
