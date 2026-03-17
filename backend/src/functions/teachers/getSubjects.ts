import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { mongo, Types } from 'mongoose'
import { Class } from "../../models/schemas/class.schema";
import { TeacherAssignment } from "../../models/schemas/teacher-assignment.schema";
import { Subject, SubjectView } from "../../models/schemas/subject.schema";

const getStudentSubjects = async (userId: Types.ObjectId) => {
  await connectDatabase();
  const classes = await Class
    .find({
      students: { $in: [userId] },
    })

  if (classes.length === 0) {
    return { success: true, subjects: [] };
  }

  const classIds = classes.map((c) => c._id);

  // 2. Trova le materie associate a queste classi via teacher_assignments
  const assignments = await TeacherAssignment
    .find({
      classId: { $in: classIds },
    })

  if (assignments.length === 0) {
    return { success: true, subjects: [] };
  }

  const subjectIds = assignments.map((a) => a.subjectId);

  // 3. Recupera i dettagli delle materie
  // Nota: Dalle ricerche precedenti il nome della collezione sembra essere "SUBJECTS"
  const subjects = await SubjectView
    .aggregate([
      {
        $match: {
          _id: { $in: subjectIds },
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
    ])

  return subjects
};

const getTeacherSubjects = async (teacherId: Types.ObjectId) => {
  return await Subject.aggregate([
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
        from: "attempts",
        let: { subjectId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$subjectId", "$$subjectId"] },
                  { $ne: ["$status", "reviewed"] },
                  { $ne: ["$source", "self-evaluation"] },
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
}

const getSubjects = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const user = context.user!;
  const userId = user!._id;
  if (user.role == 'teacher') return getTeacherSubjects(userId)
  else return getStudentSubjects(userId)
};

export const handler = lambdaRequest(getSubjects);
