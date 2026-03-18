import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Test } from "../../models/schemas/test.schema";
import { User } from "../../models/schemas/user.schema";
import { Class } from "../../models/schemas/class.schema";
import { Attempt } from "../../models/schemas/attempt.schema";
import { SubjectView } from "../../models/schemas/subject.schema";

const getTestAttemptsDetails = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const testId = request.pathParameters?.testId;

  if (!testId) {
    throw createError.BadRequest("testId is required");
  }

  await connectDatabase();

  const test = await Test.findOne({
    _id: new mongo.ObjectId(testId),
  });

  if (!test) {
    throw createError.NotFound("Test non trovato");
  }

  const fitScore = test.fitScore || 0;
  // 1. Prendi i classIds (che potrebbero essere stringhe)
  const classIdsRaw = test.classIds || [];
  const distinctClasses = await User
    .distinct("organizationIds", { role: "student" });
  console.log(
    "ID delle classi che hanno almeno uno studente:",
    distinctClasses,
  );

  const classIds = (test.classIds || []).map((id: any) => new mongo.ObjectId(id));

  const associatedClasses = await Class
    .find({ _id: { $in: classIds } })

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
  const attemptsWithStudents = await Attempt
    .aggregate([
      {
        $match: { testId: new mongo.ObjectId(testId) },
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
          studentId: 1,
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

  const totalTimeSpent = attemptsWithStudents.reduce(
    (acc, curr) => acc + (curr.timeSpent || 0),
    0,
  );
  const avgTimeSpent =
    totalDeliveries > 0 ? Math.round(totalTimeSpent / totalDeliveries) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Risolvi i nomi degli argomenti dalla materia del test
  const subject = test.subjectId
    ? await SubjectView.findOne({ _id: test.subjectId })
    : null;
  const topicsMap = new Map<string, string>();
  if (subject?.topics && Array.isArray(subject.topics)) {
    for (const t of subject.topics) {
      if (t && typeof t === "object" && t._id) {
        topicsMap.set(t._id.toString(), t.name || "Generale");
      }
    }
  }

  // Aggiungi il nome del topic a ogni domanda di ogni attempt
  const attemptsWithTopics = attemptsWithStudents.map((attempt: any) => ({
    ...attempt,
    questions: (attempt.questions || []).map((q: any) => ({
      ...q,
      question: {
        ...q.question,
        topic:
          (q.question?.topicId
            ? topicsMap.get(q.question.topicId.toString())
            : null) || "Generale",
      },
    })),
  }));

  // Studenti assegnati senza attempt: includi con status "not-started"
  const attemptStudentIds = new Set(
    attemptsWithStudents.map((a: any) => a.studentId?.toString()),
  );
  const missingStudentIds = [...uniqueStudentIds].filter(
    (id) => !attemptStudentIds.has(id as string),
  );

  let missingStudents: any[] = [];
  if (missingStudentIds.length > 0) {
    const students = await User
      .find({
        _id: { $in: missingStudentIds.map((id) => new mongo.ObjectId(id as string)) },
      }, { firstName: 1, lastName: 1 })

    missingStudents = students.map((s) => ({
      _id: null,
      status: "not-started",
      studentName: s.firstName,
      studentLastName: s.lastName,
      score: null,
      maxScore: null,
      deliveredAt: null,
      questions: [],
    }));
  }

  const allAssignees = [...attemptsWithTopics, ...missingStudents];

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
      { title: "Tempo medio", value: formatTime(avgTimeSpent), icon: "clock" },
      { title: "Assegnazioni", value: totalAssignments, icon: "users" },
    ],
    attempts: allAssignees,
  };
};

export const handler = lambdaRequest(getTestAttemptsDetails);
