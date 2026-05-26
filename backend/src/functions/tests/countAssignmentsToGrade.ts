import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Attempt } from "../../models/schemas/attempt.schema";

const countAssignmentsToGrade = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();
  const subjectId = context.subjectId;

  const matchStage: any = {
    status: "delivered",
    subjectId: subjectId,
  };

  if (context.user?._id) {
    matchStage.teacherId = context.user._id;
  }

  const result = await Attempt.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "tests",
        localField: "testId",
        foreignField: "_id",
        as: "test",
      },
    },
    { $match: { "test.0": { $exists: true } } },
    { $count: "count" },
  ]);

  return {
    count: result[0]?.count ?? 0,
  };
};

export const handler = lambdaRequest(countAssignmentsToGrade);
