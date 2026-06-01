import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Report } from "../../models/schemas/report.schema";

const updateReport = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const adminRole = context.user?.role;

  if (adminRole !== "admin") {
    throw createError.Forbidden("Solo gli amministratori possono modificare i report");
  }

  const reportId = request.pathParameters?.id;
  if (!reportId) {
    throw createError.BadRequest("ID del report richiesto");
  }

  const body = JSON.parse(request.body || "{}");
  const { status } = body;

  if (!status || !['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
    throw createError.BadRequest("Status non valido");
  }

  await connectDatabase();

  const updatedReport = await Report.findByIdAndUpdate(
    reportId,
    { status },
    { new: true }
  );

  if (!updatedReport) {
    throw createError.NotFound("Report non trovato");
  }

  return {
    success: true,
    report: updatedReport,
  };
};

export const handler = lambdaRequest(updateReport);
