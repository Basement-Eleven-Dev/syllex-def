import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getTestAttemptsDetails = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const testId = request.pathParameters?.testId;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  const db = await getDefaultDatabase();

  const test = await db.collection("tests").findOne({
    _id: new ObjectId(testId),
  });

  if (!test) {
    throw createError.NotFound("Test non trovato");
  }

  const fitScore = test.fitScore || 0;
  // 1. Prendi i classIds (che potrebbero essere stringhe)
  const classIdsRaw = test.classIds || [];
  const distinctClasses = await db
    .collection("users")
    .distinct("organizationIds", { role: "student" });
  console.log(
    "ID delle classi che hanno almeno uno studente:",
    distinctClasses,
  );

  const classIds = (test.classIds || []).map((id: any) => new ObjectId(id));

  const associatedClasses = await db
    .collection("classes")
    .find({ _id: { $in: classIds } })
    .toArray();

  const uniqueStudentIds = new Set();

  associatedClasses.forEach((clazz) => {
    if (clazz.students && Array.isArray(clazz.students)) {
      clazz.students.forEach((studentId: any) => {
        // Aggiungiamo l'ID come stringa nel Set per il confronto
        uniqueStudentIds.add(studentId.toString());
      });
    }
  });

  const totalAssignments = uniqueStudentIds.size;

  console.log(
    `Il test è assegnato a ${associatedClasses.length} classi per un totale di ${totalAssignments} studenti.`,
  );
  const attemptsWithStudents = await db
    .collection("attempts")
    .aggregate([
      {
        $match: { testId: new ObjectId(testId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "studentDetails",
        },
      },
      {
        $unwind: {
          path: "$studentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          score: 1,
          maxScore: 1,
          deliveredAt: 1,
          status: 1,
          timeSpent: 1,
          studentName: "$studentDetails.firstName",
          studentLastName: "$studentDetails.lastName",

          questions: 1,
        },
      },
      { $sort: { deliveredAt: -1 } },
    ])
    .toArray();

  const totalDeliveries = attemptsWithStudents.length;
  let totalScore = 0;
  let eligibleCount = 0;
  let toGradeCount = 0;
  attemptsWithStudents.forEach((attempt) => {
    totalScore += attempt.score || 0;

    if ((attempt.score || 0) >= fitScore) {
      eligibleCount++;
    }

    if (attempt.status !== "reviewed") {
      toGradeCount++;
    }
  });

  const avgScore =
    totalDeliveries > 0 ? (totalScore / totalDeliveries).toFixed(1) : "0";

  return {
    test: {
      _id: test._id,
      name: test.name,
      availableFrom: test.availableFrom,
      status: test.status,
      maxScore: test.maxScore,
      fitScore: test.fitScore,
    },
    stats: [
      { title: "Consegne", value: totalDeliveries, icon: "paper-plane" },
      {
        title: "Punteggio medio",
        value: `${avgScore} / ${test.maxScore}`,
        icon: "chart-bar",
      },
      { title: "Idonei", value: eligibleCount, icon: "check-circle" },
      { title: "Da correggere", value: toGradeCount, icon: "pen-nib" },
      { title: "Assegnazioni", value: totalAssignments, icon: "users" },
    ],
    attempts: attemptsWithStudents,
  };
};

export const handler = lambdaRequest(getTestAttemptsDetails);
