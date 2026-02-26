import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getOrganizationStats = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  const db = await getDefaultDatabase();
  const orgObjectId = new ObjectId(organizationId);

  // 1. KPI Counts
  // Users may store the org in either `organizationId` (singular) or `organizationIds` (array)
  const orgFilter = { $or: [{ organizationId: orgObjectId }, { organizationIds: orgObjectId }] };

  const totalStudents = await db.collection("users").countDocuments({
    ...orgFilter,
    role: "student"
  });

  const totalTeachers = await db.collection("users").countDocuments({
    ...orgFilter,
    role: "teacher"
  });

  const activeClasses = await db.collection("classes").countDocuments({
    organizationId: orgObjectId
  });

  // Tests belong to an organization via their subjectId
  const publishedTests = await db.collection("tests").aggregate([
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $match: {
        "subject.organizationId": orgObjectId,
        status: "pubblicato"
      }
    },
    { $count: "total" }
  ]).toArray();

  // Engagement KPIs: Total attempts and active students for the org
  const engagementData = await db.collection("attempts").aggregate([
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    { $match: { "subject.organizationId": orgObjectId } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        activeStudents: { $addToSet: "$studentId" }
      }
    },
    {
      $project: {
        totalAttempts: 1,
        activeStudents: { $size: "$activeStudents" }
      }
    }
  ]).toArray();

  const kpis = {
    totalStudents,
    totalTeachers,
    activeClasses,
    publishedTests: publishedTests[0]?.total || 0,
    totalAttempts: engagementData[0]?.totalAttempts || 0,
    activeStudents: engagementData[0]?.activeStudents || 0
  };

  // 2. Teaching Activity
  
  // Tests by Subject
  const testsBySubject = await db.collection("tests").aggregate([
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $match: {
        "subject.organizationId": orgObjectId
      }
    },
    {
      $group: {
        _id: "$subject._id",
        subjectName: { $first: "$subject.name" },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        subject: "$subjectName",
        count: 1
      }
    }
  ]).toArray();

  // Teacher Load
  const teacherLoad = await db.collection("teacher_assignments").aggregate([
    { $match: { organizationId: orgObjectId } },
    {
      $group: {
        _id: "$teacherId",
        classIds: { $addToSet: "$classId" },
        subjectIds: { $addToSet: "$subjectId" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "teacher"
      }
    },
    { $unwind: "$teacher" },
    {
      $lookup: {
        from: "classes",
        localField: "classIds",
        foreignField: "_id",
        as: "classes"
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "subjectIds",
        foreignField: "_id",
        as: "subjects"
      }
    },
    {
      $project: {
        _id: 0,
        name: { $concat: ["$teacher.firstName", " ", "$teacher.lastName"] },
        classesCount: { $size: "$classIds" },
        subjectsCount: { $size: "$subjectIds" },
        assignedClasses: "$classes.name",
        assignedSubjects: "$subjects.name"
      }
    }
  ]).toArray();

  // Upcoming Tests
  const now = new Date();
  const upcomingTests = await db.collection("tests").aggregate([
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $match: {
        "subject.organizationId": orgObjectId,
        availableFrom: { $gt: now }
      }
    },
    { $sort: { availableFrom: 1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        title: "$name",
        subject: "$subject.name",
        availableFrom: 1
      }
    }
  ]).toArray();
  // Average Grades by Subject
  const avgGradesBySubject = await db.collection("attempts").aggregate([
    {
      $match: {
        status: "reviewed",
        maxScore: { $gt: 0 }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "subject"
      }
    },
    { $unwind: "$subject" },
    {
      $match: {
        "subject.organizationId": orgObjectId
      }
    },
    {
      $group: {
        _id: "$subject._id",
        subjectName: { $first: "$subject.name" },
        avgScore: { $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] } },
        totalAttempts: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        subject: "$subjectName",
        avgScore: { $round: ["$avgScore", 1] },
        totalAttempts: 1
      }
    },
    { $sort: { subject: 1 } }
  ]).toArray();

  return {
    kpis,
    teachingActivity: {
      testsBySubject,
      teacherLoad,
      upcomingTests,
      avgGradesBySubject
    }
  };
};

export const handler = lambdaRequest(getOrganizationStats);
