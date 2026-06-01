import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Report } from "../../models/schemas/report.schema";

const getReports = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const adminRole = context.user?.role;

  if (adminRole !== "admin") {
    throw createError.Forbidden("Solo gli amministratori possono visualizzare i report");
  }

  await connectDatabase();

  const reports = await Report.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "teacherId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        comment: 1,
        url: 1,
        userAgent: 1,
        status: 1,
        createdAt: 1,
        user: {
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
          role: "$user.role",
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return {
    success: true,
    reports,
  };
};

export const handler = lambdaRequest(getReports);
