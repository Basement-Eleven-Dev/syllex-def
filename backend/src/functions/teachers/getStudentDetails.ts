import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getStudentDetails = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = request.pathParameters?.studentId;
  const classId = request.queryStringParameters?.classId;
  const subjectIdParam = request.queryStringParameters?.subjectId;
  const page = parseInt(request.queryStringParameters?.page || "1", 10);
  const limit = parseInt(request.queryStringParameters?.limit || "10", 10);
  const skip = (page - 1) * limit;

  console.log(
    `Fetching details for student: ${studentId}, class: ${classId}, subject: ${subjectIdParam}, page: ${page}, limit: ${limit}`,
  );

  if (!studentId || !ObjectId.isValid(studentId)) {
    console.error("Invalid studentId provided:", studentId);
    throw createError.BadRequest("Invalid or missing studentId");
  }

  const db = await getDefaultDatabase();
  const studentObjectId = new ObjectId(studentId);

  // 1. Get Student Info
  const student = await db
    .collection("users")
    .findOne({ _id: studentObjectId });
  if (!student) {
    console.error("Student not found in users collection:", studentId);
    throw createError.NotFound("Student not found");
  }

  // 2. Resolve subjectId context (priority: direct param > classId resolution)
  let subjectId: ObjectId | null = null;

  if (subjectIdParam && ObjectId.isValid(subjectIdParam)) {
    subjectId = new ObjectId(subjectIdParam);
  } else if (classId && ObjectId.isValid(classId)) {
    const classData = await db
      .collection("classes")
      .findOne({ _id: new ObjectId(classId) });
    if (classData) {
      // Find the subjectId from teacher_assignments
      const assignment = await db
        .collection("teacher_assignments")
        .findOne({ classId: new ObjectId(classId) });
      if (assignment?.subjectId) {
        subjectId = new ObjectId(assignment.subjectId);
      }
    }
  }

  // 3. Get All Attempts for this student (with filtering)
  const attemptMatch: any = { studentId: studentObjectId };
  if (subjectId) {
    attemptMatch.subjectId = subjectId;
  }

  console.log("Searching attempts with match:", JSON.stringify(attemptMatch));

  // Get total count for pagination (of all filtered attempts)
  const totalAttempts = await db
    .collection("attempts")
    .countDocuments(attemptMatch);

  const attempts = await db
    .collection("attempts")
    .aggregate([
      { $match: attemptMatch },
      {
        $lookup: {
          from: "tests",
          localField: "testId",
          foreignField: "_id",
          as: "testData",
        },
      },
      { $unwind: { path: "$testData", preserveNullAndEmptyArrays: true } },
      { $sort: { deliveredAt: -1, lastUpdatedAt: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ])
    .toArray();

  console.log(
    `Found ${attempts.length} attempts for student (total: ${totalAttempts})`,
  );

  // 4. Calculate Stats & Info for Charts (using ALL attempts for this subject/student context, not just the paged ones)
  // To get accurate stats, we need to know performance across all attempts in this context
  const allAttemptsInContext = await db
    .collection("attempts")
    .aggregate([
      { $match: attemptMatch },
      {
        $lookup: {
          from: "tests",
          localField: "testId",
          foreignField: "_id",
          as: "testData",
        },
      },
      { $unwind: { path: "$testData", preserveNullAndEmptyArrays: true } },
    ])
    .toArray();

  const completedAttempts = allAttemptsInContext.filter(
    (a) =>
      a.status === "delivered" ||
      a.status === "reviewed" ||
      a.status === "submitted",
  );
  const completedTests = completedAttempts.length;

  const scoredAttempts = allAttemptsInContext.filter(
    (a) => a.score != null && a.maxScore > 0,
  );
  let avgScore = 0;
  if (scoredAttempts.length > 0) {
    const totalPercentage = scoredAttempts.reduce((sum, a) => {
      const percentage = (a.score / a.maxScore) * 100;
      return sum + percentage;
    }, 0);
    avgScore = Math.round(totalPercentage / scoredAttempts.length);
  }

  // Performance by Topic logic remains same but uses allAttemptsInContext
  const currentSubjectIds = [
    ...new Set(
      completedAttempts
        .map((a: any) => a.testData?.subjectId || a.subjectId)
        .filter(Boolean)
        .map((id: any) => id.toString()),
    ),
  ].map((id) => new ObjectId(id));

  const subjects =
    currentSubjectIds.length > 0
      ? await db
          .collection("SUBJECTS")
          .find({ _id: { $in: currentSubjectIds } })
          .toArray()
      : [];

  const topicsNameMap = new Map<string, string>();
  for (const s of subjects) {
    if (s?.topics && Array.isArray(s.topics)) {
      for (const t of s.topics) {
        if (t?._id)
          topicsNameMap.set(t._id.toString(), t.name ?? "Sconosciuto");
      }
    }
  }

  const topicPerformanceMap = new Map<
    string,
    { totalScore: number; totalMax: number; name: string }
  >();
  completedAttempts.forEach((a: any) => {
    (a.questions || []).forEach((q: any) => {
      const topicId = q.question?.topicId?.toString();
      if (!topicId) return;
      const topicName = topicsNameMap.get(topicId) || "Generale";
      const current = topicPerformanceMap.get(topicId) || {
        totalScore: 0,
        totalMax: 0,
        name: topicName,
      };
      current.totalScore += q.score || 0;
      current.totalMax += q.points || 0;
      topicPerformanceMap.set(topicId, current);
    });
  });

  const performanceByTopic = Array.from(topicPerformanceMap.entries())
    .map(([id, data]) => ({
      topicId: id,
      name: data.name,
      percentage:
        data.totalMax > 0
          ? Math.round((data.totalScore / data.totalMax) * 100)
          : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const performanceByTest = completedAttempts
    .slice(0, 10)
    .map((a: any) => ({
      name: a.testData?.name || "Test Sconosciuto",
      score:
        (a.maxScore || a.testData?.maxScore) > 0
          ? Math.round((a.score / (a.maxScore || a.testData?.maxScore)) * 100)
          : 0,
      date: a.deliveredAt || a.createdAt,
    }))
    .reverse();

  return {
    student: {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      username: student.username,
      avatar: student.avatar,
    },
    stats: {
      avgScore,
      completedTests,
      totalTests: totalAttempts,
    },
    attempts: attempts.map((a) => ({
      _id: a._id,
      testName: a.testData?.name || "Test Sconosciuto",
      status: a.status,
      score: a.score,
      maxScore: a.maxScore,
      deliveredAt: a.deliveredAt || a.createdAt,
      testId: a.testId,
    })),
    pagination: {
      total: totalAttempts,
      page,
      limit,
      totalPages: Math.ceil(totalAttempts / limit),
    },
    performanceByTest,
    performanceByTopic,
  };
};

export const handler = lambdaRequest(getStudentDetails);
