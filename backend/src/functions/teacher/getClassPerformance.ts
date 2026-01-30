import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

type TimeRangeKey = "7d" | "30d" | "all";

interface ClassPerformanceMetrics {
  completionRate: number | null;
  averageCompletionTimeMinutes: number | null;
  improvementTrendPercentage: number | null;
  studentsAboveThresholdPercentage: number | null;
  engagedStudentsPercentage: number | null;
  totalGradedSubmissions: number;
}

interface SubmissionRow {
  _id: ObjectId;
  studentId: ObjectId;
  testId: ObjectId;
  status: string;
  startedAt?: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  completionDate?: Date | null;
  totalScoreAwarded: number;
}

const DEFAULT_TIME_RANGE: TimeRangeKey = "30d";
const PASSING_THRESHOLD = 70;
const COMPLETED_STATUSES = new Set([
  "submitted",
  "partially-graded",
  "graded",
  "ai-grading-in-progress",
]);

const MAX_REASONABLE_DURATION_MINUTES = 240; //limite di 3 ore per conteggiare il tempo medio per test dato che uscivano dati di 45h (magari per consegne anomale)

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const {
    classId,
    subjectId,
    timeRange: rawTimeRange,
  } = JSON.parse(req.body || "{}");

  if (!classId || !ObjectId.isValid(classId)) {
    return res.status(400).json({ message: "ID della classe non valido." });
  }

  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res.status(400).json({ message: "ID della materia non valido." });
  }

  const classObjectId = new ObjectId(classId);
  const subjectObjectId = new ObjectId(subjectId);
  const normalizedTimeRange = normalizeTimeRange(rawTimeRange);
  const referenceRange = resolveDateRange(normalizedTimeRange, new Date());

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);

    const hasAccess = await db.collection("classes").countDocuments({
      _id: classObjectId,
      "teachingAssignments.teacherId": user._id,
    });

    if (hasAccess === 0) {
      return res.status(403).json({
        message: "Non sei autorizzato a visualizzare i dati di questa classe.",
      });
    }

    const classInfo = await db
      .collection("classes")
      .findOne({ _id: classObjectId }, { projection: { studentIds: 1 } });

    const totalStudents = Array.isArray(classInfo?.studentIds)
      ? classInfo!.studentIds.length
      : 0;

    const testsForSubject = await db
      .collection("tests")
      .find({ subjectId: subjectObjectId })
      .project({ _id: 1, totalPoints: 1 })
      .toArray();

    if (testsForSubject.length === 0) {
      return res.status(200).json({
        overallAverage: 0,
        studentPerformance: [],
        metrics: createEmptyMetrics(),
      });
    }

    const testsMap = new Map<string, number>();
    const testIds: ObjectId[] = [];
    testsForSubject.forEach((test) => {
      const id = test._id.toString();
      testsMap.set(
        id,
        typeof test.totalPoints === "number" ? test.totalPoints : 0
      );
      testIds.push(test._id);
    });

    const assignments = await db
      .collection("testAssignments")
      .find({ classId: classObjectId, testId: { $in: testIds } })
      .project({ _id: 1, availableFrom: 1 })
      .toArray();

    const submissions = (await db
      .collection("testsubmissions")
      .aggregate<SubmissionRow>([
        {
          $match: {
            classId: classObjectId,
            testId: { $in: testIds },
          },
        },
        {
          $addFields: {
            completionDate: {
              $ifNull: [
                "$gradedAt",
                {
                  $ifNull: ["$submittedAt", "$startedAt"],
                },
              ],
            },
          },
        },
        ...(referenceRange
          ? [
            {
              $match: {
                completionDate: {
                  $gte: referenceRange.start,
                  $lte: referenceRange.end,
                },
              },
            },
          ]
          : []),
        {
          $project: {
            _id: 1,
            studentId: 1,
            testId: 1,
            status: 1,
            startedAt: 1,
            submittedAt: 1,
            gradedAt: 1,
            completionDate: 1,
            totalScoreAwarded: 1,
          },
        },
        { $sort: { completionDate: 1, _id: 1 } },
      ])
      .toArray()) as SubmissionRow[];

    const durationsMinutes: number[] = [];
    const gradedScoreEntries: Array<{
      studentId: string;
      percent: number;
      completionDate: Date | null;
    }> = [];
    const activeStudentIds = new Set<string>();
    const testsEncountered = new Set<string>();
    const studentAggregates = new Map<
      string,
      { total: number; count: number }
    >();

    submissions.forEach((submission) => {
      const studentId = submission.studentId?.toString();
      if (!studentId) {
        return;
      }

      const completionDate =
        toDate(submission.completionDate) ||
        toDate(submission.gradedAt) ||
        toDate(submission.submittedAt) ||
        toDate(submission.startedAt);
      const startedAt = toDate(submission.startedAt);

      if (
        startedAt &&
        completionDate &&
        completionDate.getTime() > startedAt.getTime()
      ) {
        const duration =
          (completionDate.getTime() - startedAt.getTime()) / 60000; // Durata in minuti

        // Aggiungiamo il filtro per gli outlier!
        if (duration < MAX_REASONABLE_DURATION_MINUTES) {
          durationsMinutes.push(duration);
        } else {
          // Logghiamo il valore anomalo per debug, ma non lo includiamo nella media
          console.warn(
            `[getClassPerformance] Ignorata durata anomala: ${duration} minuti per submission ${submission._id}`
          );
        }
      }

      if (submission.status && submission.status !== "in-progress") {
        activeStudentIds.add(studentId);
      }

      if (submission.testId) {
        testsEncountered.add(submission.testId.toString());
      }

      if (submission.status === "graded") {
        const totalPoints = testsMap.get(submission.testId.toString()) || 0;
        if (totalPoints > 0) {
          const rawPercent = (submission.totalScoreAwarded / totalPoints) * 100;
          const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));

          gradedScoreEntries.push({
            studentId,
            percent,
            completionDate,
          });

          const aggregate = studentAggregates.get(studentId) || {
            total: 0,
            count: 0,
          };
          aggregate.total += percent;
          aggregate.count += 1;
          studentAggregates.set(studentId, aggregate);
        }
      }
    });

    const studentIdsForNames = Array.from(studentAggregates.keys()).map(
      (id) => new ObjectId(id)
    );

    const studentsInfo = studentIdsForNames.length
      ? await db
        .collection("users")
        .find({ _id: { $in: studentIdsForNames } })
        .project({ firstName: 1, lastName: 1, username: 1 })
        .toArray()
      : [];

    const studentNamesMap = new Map<string, string>();
    studentsInfo.forEach((student) => {
      const name = [student.firstName, student.lastName]
        .filter((part) => typeof part === "string" && part.trim().length > 0)
        .join(" ");
      studentNamesMap.set(
        student._id.toString(),
        name || student.username || "Studente"
      );
    });

    const studentPerformance = Array.from(studentAggregates.entries())
      .map(([studentId, aggregate]) => ({
        studentId,
        studentName: studentNamesMap.get(studentId) || "Studente",
        averageScore: Math.round(aggregate.total / aggregate.count),
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    const overallAverage =
      studentPerformance.length > 0
        ? Math.round(
          studentPerformance.reduce(
            (sum, student) => sum + student.averageScore,
            0
          ) / studentPerformance.length
        )
        : 0;

    const studentsAboveThreshold = studentPerformance.filter(
      (student) => student.averageScore >= PASSING_THRESHOLD
    ).length;

    const assignmentsInRange = referenceRange
      ? assignments.filter((assignment) =>
        isDateWithinRange(assignment.availableFrom, referenceRange)
      )
      : assignments;

    const denominatorTests = Math.max(
      assignmentsInRange.length,
      testsEncountered.size
    );

    const expectedSubmissions =
      denominatorTests > 0 && totalStudents > 0
        ? denominatorTests * totalStudents
        : 0;

    const completedSubmissionsCount = submissions.filter((submission) =>
      COMPLETED_STATUSES.has(submission.status)
    ).length;

    const rawCompletionRate =
      expectedSubmissions > 0
        ? (completedSubmissionsCount / expectedSubmissions) * 100
        : null;

    const averageCompletionTimeMinutes = roundOrNull(
      durationsMinutes.length > 0
        ? durationsMinutes.reduce((sum, value) => sum + value, 0) /
        durationsMinutes.length
        : null
    );

    const sortedEntries = gradedScoreEntries
      .filter((entry) => entry.completionDate)
      .sort(
        (a, b) =>
          (a.completionDate as Date).getTime() -
          (b.completionDate as Date).getTime()
      );
    const lastThree = sortedEntries.slice(-3);
    const previousThree = sortedEntries.slice(-6, -3);
    const lastAverage = averagePercentage(lastThree);
    const previousAverage = averagePercentage(previousThree);

    const improvementTrendPercentage =
      lastAverage !== null && previousAverage !== null
        ? Math.round(lastAverage - previousAverage)
        : null;

    const metrics: ClassPerformanceMetrics = {
      completionRate: clampPercentage(rawCompletionRate),
      averageCompletionTimeMinutes,
      improvementTrendPercentage,
      studentsAboveThresholdPercentage:
        totalStudents > 0
          ? clampPercentage((studentsAboveThreshold / totalStudents) * 100)
          : null,
      engagedStudentsPercentage:
        totalStudents > 0
          ? clampPercentage((activeStudentIds.size / totalStudents) * 100)
          : null,
      totalGradedSubmissions: gradedScoreEntries.length,
    };

    return res.status(200).json({
      overallAverage,
      studentPerformance,
      metrics,
    });
  } catch (error) {
    console.error("Errore nel calcolo delle performance della classe:", error);
    return res.status(500).json({
      message: "Errore del server durante il calcolo delle statistiche.",
      error: error instanceof Error ? error.message : "Errore Sconosciuto",
    });
  }
};

function normalizeTimeRange(input: unknown): TimeRangeKey {
  if (input === "7d" || input === "30d" || input === "all") {
    return input;
  }
  return DEFAULT_TIME_RANGE;
}

function resolveDateRange(
  range: TimeRangeKey,
  now: Date
): { start: Date; end: Date } | null {
  if (range === "all") {
    return null;
  }

  const days = range === "7d" ? 7 : 30;
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  return { start, end };
}

function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function createEmptyMetrics(): ClassPerformanceMetrics {
  return {
    completionRate: null,
    averageCompletionTimeMinutes: null,
    improvementTrendPercentage: null,
    studentsAboveThresholdPercentage: null,
    engagedStudentsPercentage: null,
    totalGradedSubmissions: 0,
  };
}

function clampPercentage(value: number | null): number | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function roundOrNull(value: number | null): number | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value);
}

function isDateWithinRange(
  value: unknown,
  range: { start: Date; end: Date }
): boolean {
  const date = toDate(value);
  if (!date) {
    return false;
  }
  return (
    date.getTime() >= range.start.getTime() &&
    date.getTime() <= range.end.getTime()
  );
}

function averagePercentage(
  entries: Array<{ percent: number; completionDate: Date | null }>
): number | null {
  if (!entries.length) {
    return null;
  }
  const sum = entries.reduce((total, entry) => total + entry.percent, 0);
  return sum / entries.length;
}
