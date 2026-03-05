import { APIGatewayProxyEvent } from "aws-lambda";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import createError from "http-errors";

const getAttemptDetails = async (request: APIGatewayProxyEvent) => {
  const attemptId = request.pathParameters?.attemptId;
  if (!attemptId) throw createError.BadRequest("ID tentativo mancante");

  const db = await getDefaultDatabase();

  const result = await db
    .collection("attempts")
    .aggregate([
      { $match: { _id: new ObjectId(attemptId) } },
      {
        $lookup: {
          from: "tests",
          localField: "testId",
          foreignField: "_id",
          as: "testInfo",
        },
      },
      { $unwind: "$testInfo" },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      { $unwind: "$studentInfo" },
    ])
    .toArray();

  const attempt = result[0];
  if (!attempt) throw createError.NotFound("Tentativo non trovato");

  const questionsStats = { correct: 0, wrong: 0, empty: 0, dubious: 0 };

  const mappedQuestions = attempt.questions.map((q: any) => {
    // 1. Recupero configurazione punti dal Test
    const testQuestionConfig = attempt.testInfo.questions?.find(
      (tq: any) =>
        (tq.questionId?.toString() || tq.id?.toString()) ===
        q.question._id.toString(),
    );
    const questionMaxScore = testQuestionConfig?.points ?? 1;

    let resultStatus: "correct" | "wrong" | "dubious" | "empty" = "empty";
    let currentScore = 0;

    const isOpenQuestion =
      q.question.type === "risposta aperta" || q.question.type === "aperta";
    const isEmpty = !q.answer || q.answer.toString().trim() === "";

    // 2. LOGICA DEDUTTIVA
    if (isEmpty) {
      resultStatus = "empty";
      currentScore = 0;
      questionsStats.empty++;
    } else if (isOpenQuestion) {
      // Per le APERTE: deduciamo lo stato dal campo status, ma il punteggio è quello del DB
      resultStatus =
        q.status === "correct"
          ? "correct"
          : q.status === "wrong"
            ? "wrong"
            : "dubious";

      currentScore = q.score ?? 0; // Qui ci fidiamo del DB (o dell'AI)

      if (resultStatus === "dubious") questionsStats.dubious++;
      else if (resultStatus === "correct") questionsStats.correct++;
      else questionsStats.wrong++;
    } else {
      // Per le CHIUSE: deduciamo tutto dal confronto answer <-> options / correctAnswer
      let isCorrect = false;

      if (q.question.type === "vero falso") {
        // "vero falso" usa correctAnswer: boolean, lo studente risponde 'Vero'/'Falso'
        isCorrect =
          (q.answer === "Vero" && q.question.correctAnswer === true) ||
          (q.answer === "Falso" && q.question.correctAnswer === false);
      } else {
        const correctOption = q.question.options?.find(
          (opt: any) => opt.isCorrect,
        );
        isCorrect =
          q.answer?.toString().trim() ===
          correctOption?.label?.toString().trim();
      }

      if (isCorrect) {
        resultStatus = "correct";
        currentScore = questionMaxScore; // Forza il punteggio massimo
        questionsStats.correct++;
      } else {
        resultStatus = "wrong";
        currentScore = 0;
        questionsStats.wrong++;
      }
    }

    return {
      question: q.question,
      answer: {
        result: resultStatus,
        answer: q.answer,
        isCorrect: resultStatus === "correct",
        isEmpty: resultStatus === "empty",
        score: currentScore,
        maxScore: questionMaxScore,
        feedback: q.teacherComment || "",
      },
    };
  });

  // 4. Calcolo medie della classe per questo test
  const classStats = await db
    .collection("attempts")
    .aggregate([
      { $match: { testId: attempt.testId, status: "reviewed" } },
      {
        $group: {
          _id: "$testId",
          avgScore: { $avg: "$score" },
          avgTime: { $avg: "$timeSpent" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const averages = classStats[0] || { avgScore: 0, avgTime: 0, count: 0 };

  // 5. Calcolo Punteggio Totale e Performance per Argomento
  const totalCalculatedScore = mappedQuestions.reduce(
    (acc: number, curr: any) => acc + (Number(curr.answer.score) || 0),
    0,
  );

  // Recupero nomi argomenti dalla materia
  const subject = await db.collection("SUBJECTS").findOne({ _id: attempt.testInfo.subjectId });
  const topicsMap = new Map<string, string>();
  if (subject?.topics && Array.isArray(subject.topics)) {
    for (const t of subject.topics) {
      if (t && typeof t === "object" && t._id) {
        topicsMap.set(t._id.toString(), t.name || "Generale");
      }
    }
  }

  const studentTopicPerformance: { [key: string]: { score: number; max: number } } = {};
  mappedQuestions.forEach((mq: any) => {
    const topicId = mq.question.topicId?.toString();
    const topicName = (topicId ? topicsMap.get(topicId) : null) || "Generale";
    
    if (!studentTopicPerformance[topicName]) studentTopicPerformance[topicName] = { score: 0, max: 0 };
    studentTopicPerformance[topicName].score += mq.answer.score;
    studentTopicPerformance[topicName].max += mq.answer.maxScore;
  });

  const studentTopics = Object.entries(studentTopicPerformance).map(([name, stats]) => ({
    name,
    percentage: stats.max > 0 ? Math.round((stats.score / stats.max) * 100) : 0
  }));

  // 6. Calcolo performance della classe per argomento in questo test
  const allAttempts = await db.collection("attempts")
    .find({ testId: attempt.testId, status: "reviewed" })
    .toArray();

  const classTopicPerformance: { [key: string]: { score: number; max: number } } = {};
  allAttempts.forEach((att: any) => {
    att.questions.forEach((q: any) => {
      const topicId = q.question.topicId?.toString();
      const topicName = (topicId ? topicsMap.get(topicId) : null) || "Generale";
      
      const testQuestionConfig = attempt.testInfo.questions?.find(
        (tq: any) => (tq.questionId?.toString() || tq.id?.toString()) === q.question._id.toString()
      );
      const qMax = testQuestionConfig?.points ?? 1;
      
      if (!classTopicPerformance[topicName]) classTopicPerformance[topicName] = { score: 0, max: 0 };
      classTopicPerformance[topicName].score += (q.score || 0);
      classTopicPerformance[topicName].max += qMax;
    });
  });

  const classTopics = Object.entries(classTopicPerformance).map(([name, stats]) => ({
    name,
    percentage: stats.max > 0 ? Math.round((stats.score / stats.max) * 100) : 0
  }));

  return {
    testId: attempt.testId,
    testTitle: attempt.testInfo.name,
    studentName: `${attempt.studentInfo.firstName} ${attempt.studentInfo.lastName}`,
    status: attempt.status,
    submissionDate: attempt.deliveredAt || attempt.updatedAt,
    score: totalCalculatedScore,
    maxScore: attempt.testInfo.maxScore || attempt.maxScore,
    timeSpent: attempt.timeSpent,
    maxTime: attempt.testInfo.timeLimit || 0,
    classAverageScore: Number(averages.avgScore.toFixed(1)),
    classAverageTime: Math.round(averages.avgTime),
    totalQuestions: attempt.questions.length,
    questionsStats: questionsStats,
    studentTopicPerformance: studentTopics,
    classTopicPerformance: classTopics,
    aiInsight: attempt.aiInsight || null,
    questions: mappedQuestions,
  };
};

export const handler = lambdaRequest(getAttemptDetails);
