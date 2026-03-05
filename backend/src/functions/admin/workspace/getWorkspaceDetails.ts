import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getWorkspaceDetails = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);

  // 1. Get Organization basic info
  const organization = await db.collection("organizations").findOne({ _id: orgObjectId });
  if (!organization) {
    throw createError.NotFound("Organization not found");
  }

  // 2. Base Stats (Total counts)
  const staffCount = await db.collection("users").countDocuments({ 
    $or: [
      { organizationId: orgObjectId },
      { organizationIds: orgObjectId }
    ],
    role: { $in: ["teacher", "admin"] }
  });

  const studentsCount = await db.collection("users").countDocuments({ 
    $or: [
      { organizationId: orgObjectId },
      { organizationIds: orgObjectId }
    ],
    role: "student"
  });

  const classesCount = await db.collection("classes").countDocuments({ 
    organizationId: orgObjectId
  });

  const subjectsCount = await db.collection("subjects").countDocuments({ 
    organizationId: orgObjectId
  });

  // 3. Performance Trend (Average Score over last 15 days)
  const subjects = await db.collection("subjects").find({ organizationId: orgObjectId }).project({ _id: 1 }).toArray();
  const subjectIds = subjects.map(s => s._id);
  const tests = await db.collection("tests").find({ subjectId: { $in: subjectIds } }).project({ _id: 1 }).toArray();
  const testIds = tests.map(t => t._id);

  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  
  const performanceTrend = await db.collection("attempts").aggregate([
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
  ]).toArray();

  // 4. Role Distribution
  const roleDistribution = await db.collection("users").aggregate([
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
  ]).toArray();

  // 5. Overall Content Totals
  const totalTests = await db.collection("tests").countDocuments({ subjectId: { $in: subjectIds } });
  const totalAttempts = await db.collection("attempts").countDocuments({ testId: { $in: testIds } });

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
