import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { mongo } from "mongoose";
import { ActivityLog } from "../../../models/schemas/activity-log.schema";
import { computeCostUsd } from "../../../_helpers/logging/modelPricing";
import { assertSuperAdmin } from "../../../_helpers/logging/assertSuperAdmin";
import { labelForAction } from "../../../_helpers/logging/actionVocabulary";
import { buildStartedAtRange } from "../../../_helpers/logging/dateRange";

/**
 * Timeline interrogabile dei log. Solo super-admin.
 * Query params (tutti opzionali):
 *   userId, organizationId, action, category, status, traceId,
 *   from, to (ISO date), limit (default 100, max 1000)
 */
const getActivityLogs = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  assertSuperAdmin(context);
  await connectDatabase();

  const q = request.queryStringParameters || {};
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

  const limit = Math.min(Number(q.limit) || 100, 1000);

  const logs = await ActivityLog.find(filter)
    .sort({ startedAt: -1 })
    .limit(limit)
    .lean();

  // Arricchisce ogni evento con l'etichetta leggibile (vocabolario azioni) e
  // gli eventi AI col costo calcolato (token x tariffa modello).
  const enriched = logs.map((log) => {
    const actionLabel = labelForAction(log.action, log.httpMethod, log.route);
    if (log.category === "ai" && log.model) {
      return {
        ...log,
        actionLabel,
        costUsd: computeCostUsd(
          log.model,
          log.inputTokens || 0,
          log.outputTokens || 0,
        ),
      };
    }
    return { ...log, actionLabel };
  });

  return {
    success: true,
    count: enriched.length,
    logs: enriched,
  };
};

export const handler = lambdaRequest(getActivityLogs);
