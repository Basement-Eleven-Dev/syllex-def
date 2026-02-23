import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { Subject } from "../../models/subject";
import { ObjectId } from "mongodb";

const getTeacherSubjects = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const teacherId = new ObjectId(request.pathParameters!.teacherId!);
  const db = await getDefaultDatabase();

  const subjects = await db
    .collection<Subject>("subjects")
    .aggregate([
      {
        $match: {
          teacherId: teacherId,
        },
      },
      {
        $lookup: {
          from: "topics",
          let: { subjectId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$subjectId", "$$subjectId"] } } },
            { $project: { _id: 1, name: 1 } },
          ],
          as: "topics",
        },
      },
      {
        $lookup: {
          from: "tests",
          let: { subjectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$subjectId", "$$subjectId"] },
                    { $ne: ["$status", "reviewed"] },
                  ],
                },
              },
            },
          ],
          as: "uncorrectedTests",
        },
      },
      {
        $addFields: {
          uncorrectedTest: { $size: "$uncorrectedTests" },
        },
      },
      {
        $project: {
          uncorrectedTests: 0,
        },
      },
    ])
    .toArray();

  return subjects;
};

export const handler = lambdaRequest(getTeacherSubjects);
