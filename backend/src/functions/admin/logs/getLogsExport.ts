import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { mongo } from "mongoose";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { ActivityLog } from "../../../models/schemas/activity-log.schema";
import { computeCostUsd } from "../../../_helpers/logging/modelPricing";
import { assertSuperAdmin } from "../../../_helpers/logging/assertSuperAdmin";
import { labelForAction } from "../../../_helpers/logging/actionVocabulary";
import { buildStartedAtRange } from "../../../_helpers/logging/dateRange";

/**
 * Export dei log. Solo super-admin. Tre formati (param `format`):
 *   - `json`        → dump grezzo (array di eventi, costo AI incluso)
 *   - `csv`         → colonne piatte per analisi tecnica
 *   - `descriptive` → report HTML leggibile, pronto per "Stampa → Salva come PDF"
 *
 * Il contenuto torna DENTRO l'envelope JSON ({ content, filename, ... }): il
 * frontend costruisce il Blob e scarica / apre per la stampa. Cosi' non si
 * combatte col serializer del middleware (che forza application/json).
 *
 * Meta-audit: scriviamo un evento esplicito `admin.logs_export` con i filtri
 * applicati → dimostrabilita' verso gli enti ("chi ha esportato cosa, quando").
 *
 * Stessi filtri di getActivityLogs: userId, organizationId, action, category,
 * status, traceId, from, to.
 */

const EXPORT_LIMIT = 10000;

type ExportFormat = "json" | "csv" | "descriptive";

type EnrichedLog = Record<string, any> & { costUsd?: number };

const buildFilter = (q: Record<string, string | undefined>) => {
  const filter: Record<string, any> = {};
  if (q.userId) filter.userId = new mongo.ObjectId(q.userId);
  if (q.userEmail) filter.userEmail = q.userEmail;
  if (q.organizationId)
    filter.organizationId = new mongo.ObjectId(q.organizationId);
  if (q.action) filter.action = q.action;
  if (q.category) filter.category = q.category;
  if (q.status) filter.status = q.status;
  if (q.traceId) filter.traceId = q.traceId;
  const range = buildStartedAtRange(q.from, q.to);
  if (range) filter.startedAt = range;
  return filter;
};

// --- CSV ---

const CSV_COLUMNS = [
  "startedAt",
  "userEmail",
  "userRole",
  "category",
  "action",
  "route",
  "status",
  "httpStatusCode",
  "durationMs",
  "model",
  "inputTokens",
  "outputTokens",
  "costUsd",
  "traceId",
] as const;

const csvCell = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  const s = value instanceof Date ? value.toISOString() : String(value);
  // Escape RFC-4180: racchiudi tra virgolette se contiene , " \n e raddoppia le "
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (logs: EnrichedLog[]): string => {
  const header = CSV_COLUMNS.join(",");
  const rows = logs.map((log) =>
    CSV_COLUMNS.map((c) => csvCell(log[c])).join(","),
  );
  return [header, ...rows].join("\n");
};

// --- Descrittivo (HTML stampabile) ---

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtDateIt = (d: Date): string =>
  new Date(d).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Trasforma un evento in una descrizione italiana leggibile, partendo
 * dall'etichetta del vocabolario azioni e aggiungendo i dettagli specifici.
 */
const describe = (log: EnrichedLog): string => {
  const dur =
    typeof log.durationMs === "number"
      ? ` (${(log.durationMs / 1000).toFixed(1)}s)`
      : "";
  const esito = log.status === "error" ? " — ESITO: errore" : "";
  const base = escapeHtml(
    labelForAction(log.action, log.httpMethod, log.route),
  );

  switch (log.category) {
    case "ai": {
      const tin = log.inputTokens ?? 0;
      const tout = log.outputTokens ?? 0;
      const cost =
        typeof log.costUsd === "number" ? `, $${log.costUsd.toFixed(6)}` : "";
      return `${base} — ${escapeHtml(log.model ?? "modello")} (${tin}+${tout} token${cost})${dur}${esito}`;
    }
    case "client": {
      const p = log.payload || {};
      if (log.action === "navigation")
        return `${base}: ${escapeHtml(String(p.path ?? ""))}`;
      if (log.action === "voice.session")
        return `${base}${dur}${p.turns ? `, ${p.turns} turni` : ""}`;
      return `${base}${dur}`;
    }
    default:
      // http / system
      return `${base}${dur}${esito}`;
  }
};

const describeFilters = (q: Record<string, string | undefined>): string => {
  const parts: string[] = [];
  if (q.userId) parts.push(`utente ${q.userId}`);
  if (q.organizationId) parts.push(`organizzazione ${q.organizationId}`);
  if (q.action) parts.push(`azione "${q.action}"`);
  if (q.category) parts.push(`categoria "${q.category}"`);
  if (q.status) parts.push(`stato "${q.status}"`);
  if (q.traceId) parts.push(`trace ${q.traceId}`);
  if (q.from) parts.push(`dal ${fmtDateIt(new Date(q.from))}`);
  if (q.to) parts.push(`al ${fmtDateIt(new Date(q.to))}`);
  return parts.length ? parts.join(" · ") : "nessun filtro (tutti gli eventi)";
};

const toDescriptiveHtml = (
  logs: EnrichedLog[],
  q: Record<string, string | undefined>,
  exportedBy: string,
): string => {
  // Eventi in ordine cronologico crescente per una lettura "a timeline".
  const ordered = [...logs].sort(
    (a, b) =>
      new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );

  const rows = ordered
    .map((log) => {
      const who = escapeHtml(log.userEmail || "utente sconosciuto");
      const role = log.userRole ? ` (${escapeHtml(log.userRole)})` : "";
      return `<tr><td class="t">${fmtDateIt(log.startedAt)}</td><td class="u">${who}${role}</td><td>${describe(log)}</td></tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>Report attività Syllex</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1a1a2e; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #555; font-size: 12px; margin-bottom: 20px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { background: #f5f5fa; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: #555; }
  td.t { white-space: nowrap; color: #444; width: 140px; }
  td.u { white-space: nowrap; color: #222; width: 220px; }
  footer { margin-top: 24px; color: #888; font-size: 11px; border-top: 1px solid #eee; padding-top: 10px; }
  @media print { body { margin: 0; } th { background: #f5f5fa !important; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
  <h1>Report attività — Syllex</h1>
  <div class="meta">
    Generato il ${fmtDateIt(new Date())} da ${escapeHtml(exportedBy)}.<br />
    Filtri applicati: ${escapeHtml(describeFilters(q))}.<br />
    Eventi inclusi: ${ordered.length}${ordered.length >= EXPORT_LIMIT ? ` (limite ${EXPORT_LIMIT} raggiunto — restringi i filtri per un export completo)` : ""}.
  </div>
  <table>
    <thead><tr><th>Quando</th><th>Utente</th><th>Attività</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <footer>
    Report di audit generato automaticamente. Contiene solo metadati delle attività (nessun contenuto sensibile).
  </footer>
</body>
</html>`;
};

const getLogsExport = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  assertSuperAdmin(context);
  await connectDatabase();

  const q = request.queryStringParameters || {};
  const format: ExportFormat =
    q.format === "csv" || q.format === "descriptive" ? q.format : "json";

  const filter = buildFilter(q);

  const raw = await ActivityLog.find(filter)
    .sort({ startedAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();

  // Arricchisce gli eventi AI col costo calcolato (token x tariffa modello)
  const logs: EnrichedLog[] = raw.map((log: any) =>
    log.category === "ai" && log.model
      ? {
          ...log,
          costUsd: computeCostUsd(
            log.model,
            log.inputTokens || 0,
            log.outputTokens || 0,
          ),
        }
      : log,
  );

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === "csv") {
    content = toCsv(logs);
    filename = `syllex-logs-${stamp}.csv`;
    mimeType = "text/csv";
  } else if (format === "descriptive") {
    content = toDescriptiveHtml(
      logs,
      q,
      context.user?.email || "super-admin",
    );
    filename = `syllex-report-${stamp}.html`;
    mimeType = "text/html";
  } else {
    content = JSON.stringify(logs, null, 2);
    filename = `syllex-logs-${stamp}.json`;
    mimeType = "application/json";
  }

  // --- Meta-audit: chi esporta cosa (evento esplicito coi filtri) ---
  try {
    await ActivityLog.create({
      category: "system",
      action: "admin.logs_export",
      userId: context.user?._id,
      userEmail: context.user?.email,
      userRole: context.user?.role,
      organizationId: context.user?.organizationIds?.[0],
      startedAt: new Date(),
      status: "success",
      stage: process.env.STAGE,
      payload: {
        format,
        count: logs.length,
        filters: describeFilters(q),
      },
    });
  } catch (err) {
    // Best-effort: l'audit non deve far fallire l'export.
    console.error("[logsExport] meta-audit fallito:", err);
  }

  return {
    success: true,
    format,
    filename,
    mimeType,
    count: logs.length,
    content,
  };
};

export const handler = lambdaRequest(getLogsExport);
