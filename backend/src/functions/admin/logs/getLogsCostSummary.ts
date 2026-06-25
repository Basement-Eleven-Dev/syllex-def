import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { mongo } from "mongoose";
import { ActivityLog } from "../../../models/schemas/activity-log.schema";
import { computeCostUsd } from "../../../_helpers/logging/modelPricing";
import { assertSuperAdmin } from "../../../_helpers/logging/assertSuperAdmin";
import { buildStartedAtRange } from "../../../_helpers/logging/dateRange";

/**
 * Riepilogo costi REALI per modello (token effettivi x tariffa). Solo super-admin.
 * Sostituisce le stime finte di getSuperAdminStats.
 * Query params opzionali: organizationId, from, to (ISO date).
 */
const getLogsCostSummary = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  assertSuperAdmin(context);
  await connectDatabase();

  const q = request.queryStringParameters || {};
  const match: Record<string, any> = { category: "ai" };

  if (q.organizationId)
    match.organizationId = new mongo.ObjectId(q.organizationId);
  const range = buildStartedAtRange(q.from, q.to);
  if (range) match.startedAt = range;

  const byModel = await ActivityLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$model",
        calls: { $sum: 1 },
        inputTokens: { $sum: { $ifNull: ["$inputTokens", 0] } },
        outputTokens: { $sum: { $ifNull: ["$outputTokens", 0] } },
        errors: {
          $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] },
        },
        rateLimited: {
          $sum: { $cond: [{ $eq: ["$rateLimited", true] }, 1, 0] },
        },
      },
    },
    { $sort: { calls: -1 } },
  ]);

  let totalCostUsd = 0;
  const models = byModel.map((m) => {
    const costUsd = computeCostUsd(m._id, m.inputTokens, m.outputTokens);
    totalCostUsd += costUsd;
    return {
      model: m._id,
      calls: m.calls,
      inputTokens: m.inputTokens,
      outputTokens: m.outputTokens,
      errors: m.errors,
      rateLimited: m.rateLimited,
      costUsd,
    };
  });

  return {
    success: true,
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
    models,
  };
};

export const handler = lambdaRequest(getLogsCostSummary);
