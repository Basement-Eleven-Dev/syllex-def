import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Organization } from "../../../models/schemas/organization.schema";
import { Subject } from "../../../models/schemas/subject.schema";
import { Class } from "../../../models/schemas/class.schema";
import { User } from "../../../models/schemas/user.schema";
import { Test } from "../../../models/schemas/test.schema";
import { Attempt } from "../../../models/schemas/attempt.schema";

const getWorkspaceDetails = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !mongo.ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  await connectDatabase();
  const orgObjectId = new mongo.ObjectId(organizationId);

  // 1. Get Organization basic info
  const organization = await Organization.findOne({ _id: orgObjectId });
  if (!organization) {
    throw createError.NotFound("Organization not found");
  }

  // 2. Base Stats (Total counts)
  const staffCount = await User.countDocuments({
    $or: [
      { organizationId: orgObjectId },
      { organizationIds: orgObjectId }
    ],
    role: { $in: ["teacher", "admin"] }
  });

  const studentsCount = await User.countDocuments({
    $or: [
      { organizationId: orgObjectId },
      { organizationIds: orgObjectId }
    ],
    role: "student"
  });

  const classesCount = await Class.countDocuments({
    organizationId: orgObjectId
  });

  const subjectsCount = await Subject.countDocuments({
    organizationId: orgObjectId
  });

  // 3. Performance Trend (Average Score over last 15 days)
  const subjects = await Subject.find({ organizationId: orgObjectId }, { _id: 1 })
  const subjectIds = subjects.map(s => s._id);
  const tests = await Test.find({ subjectId: { $in: subjectIds } }, { _id: 1 });
  const testIds = tests.map(t => t._id);

  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const performanceTrend = await Attempt.aggregate([
    {
      $match: {
        testId: { $in: testIds },
        deliveredAt: { $gte: fifteenDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt" } },
        avgScore: {
          $avg: {
            $cond: [
              { $gt: ["$maxScore", 0] },
              { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
              0
            ]
          }
        }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // 4. Role Distribution
  const roleDistribution = await User.aggregate([
    {
      $match: {
        $or: [{ organizationId: orgObjectId }, { organizationIds: orgObjectId }]
      }
    },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 }
      }
    }
  ]);

  // 5. Overall Content Totals
  const totalTests = await Test.countDocuments({ subjectId: { $in: subjectIds } });
  const totalAttempts = await Attempt.countDocuments({ testId: { $in: testIds } });

  return {
    success: true,
    organization: {
      ...organization,
      _id: organization._id.toString()
    },
    stats: {
      staffCount,
      studentsCount,
      classesCount,
      subjectsCount,
      totalTests,
      totalAttempts,
      performanceTrend,
      roleDistribution: roleDistribution.reduce((acc: any, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    }
  };
};

export const handler = lambdaRequest(getWorkspaceDetails);
