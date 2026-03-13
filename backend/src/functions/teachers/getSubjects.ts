import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { Subject } from "../../models/subject";
import { Collection, Db, ObjectId } from "mongodb";

const getStudentSubjects = async (db: Db, userId: ObjectId) => {

  const classes = await db
    .collection("classes")
    .find({
      students: { $in: [userId] },
    })
    .toArray();

  if (classes.length === 0) {
    return { success: true, subjects: [] };
  }

  const classIds = classes.map((c) => c._id);

  // 2. Trova le materie associate a queste classi via teacher_assignments
  const assignments = await db
    .collection("teacher_assignments")
    .find({
      classId: { $in: classIds },
    })
    .toArray();

  if (assignments.length === 0) {
    return { success: true, subjects: [] };
  }

  const subjectIds = assignments.map((a) => a.subjectId);

  // 3. Recupera i dettagli delle materie
  // Nota: Dalle ricerche precedenti il nome della collezione sembra essere "SUBJECTS"
  const subjects = await db
    .collection("SUBJECTS")
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
    .toArray();

  return {
    success: true,
    subjects,
  };
};

const getTeacherSubjects = async (coll: Collection, teacherId: ObjectId) => {
  return await coll.aggregate([
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
    .toArray();
}

const getSubjects = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const user = context.user!;
  const userId = user!._id;
  const db = await getDefaultDatabase();
  if (user.role == 'teacher') return getTeacherSubjects(db.collection("subjects"), userId)
  else return getStudentSubjects(db, userId)
};

export const handler = lambdaRequest(getSubjects);
