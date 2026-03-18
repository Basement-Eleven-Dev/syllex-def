import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { User } from "../../models/schemas/user.schema";
import { Class } from "../../models/schemas/class.schema";
import { Test } from "../../models/schemas/test.schema";
import { Attempt } from "../../models/schemas/attempt.schema";
import { TeacherAssignment } from "../../models/schemas/teacher-assignment.schema";

const getOrganizationStats = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const organizationId = request.pathParameters?.organizationId;

  if (!organizationId || !mongo.ObjectId.isValid(organizationId)) {
    throw createError.BadRequest("Invalid or missing organizationId");
  }

  await connectDatabase();
  const orgObjectId = new mongo.ObjectId(organizationId);

  // 1. KPI Counts
  // Users may store the org in either `organizationId` (singular) or `organizationIds` (array)
  const orgFilter = { $or: [{ organizationId: orgObjectId }, { organizationIds: orgObjectId }] };

  const totalStudents = await User.countDocuments({
    ...orgFilter,
    role: "student"
  });

  const totalTeachers = await User.countDocuments({
    ...orgFilter,
    role: "teacher"
  });

  const activeClasses = await Class.countDocuments({
    organizationId: orgObjectId
  });

  // Tests belong to an organization via their subjectId
  const publishedTests = await Test.aggregate([
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
  ]);

  // Engagement KPIs: Total attempts and active students for the org
  const engagementData = await Attempt.aggregate([
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
  ]);

  // Inactive Classes: Classes in the org that have 0 students in their array
  const classes = await Class.find({ organizationId: orgObjectId });
  const inactiveClassesCount = classes.filter(cls => !cls.students || cls.students.length === 0).length;

  const kpis = {
    totalStudents,
    totalTeachers,
    activeClasses,
    publishedTests: publishedTests[0]?.total || 0,
    totalAttempts: engagementData[0]?.totalAttempts || 0,
    activeStudents: engagementData[0]?.activeStudents || 0,
    inactiveClassesCount
  };

  // 2. Teaching Activity

  // Tests by Subject
  const testsBySubject = await Test.aggregate([
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
  ]);

  // Teacher Load
  const teacherLoad = await TeacherAssignment.aggregate([
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
  ]);

  // Upcoming Tests
  const now = new Date();
  const upcomingTests = await Test.aggregate([
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
  ]);
  // Average Grades by Subject
  const avgGradesBySubject = await Attempt.aggregate([
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
  ]);

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
