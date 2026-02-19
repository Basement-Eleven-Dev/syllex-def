import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

interface TopicPerformance {
  topicId: string;
  topicName: string;
  percentage: number;
}

const getClassTopicsPerformance = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const classId = request.pathParameters?.classId;
  const subjectId = context.subjectId;

  if (!classId) throw createError.BadRequest("classId is required");
  if (!subjectId) throw createError.BadRequest("Subject-Id header is required");

  const db = await getDefaultDatabase();

  // 1. Get class students
  const classData = await db
    .collection("classes")
    .findOne({ _id: new ObjectId(classId) });

  if (!classData) throw createError.NotFound("Class not found");

  const studentIds = (classData.students || []).map((id: string | ObjectId) =>
    typeof id === "string" ? new ObjectId(id) : id,
  );
  // 2. Get all reviewed attempts for these students in the selected subject
  const attempts = await db
    .collection("attempts")
    .find({
      studentId: { $in: studentIds },
      subjectId: subjectId,
      status: "reviewed",
    })
    .toArray();

  if (attempts.length === 0) {
    return { topicsPerformance: [] };
  }

  // 3. Aggregate score and points per topicId across all attempts/questions
  const topicTotals = new Map<
    string,
    { totalScore: number; totalPoints: number }
  >();

  for (const attempt of attempts) {
    for (const q of attempt.questions ?? []) {
      const topicId = q.question?.topicId?.toString();
      if (!topicId) continue;

      const points = q.points ?? 0;
      const score = q.score ?? 0;

      if (!topicTotals.has(topicId)) {
        topicTotals.set(topicId, { totalScore: 0, totalPoints: 0 });
      }
      const entry = topicTotals.get(topicId)!;
      entry.totalScore += score;
      entry.totalPoints += points;
    }
  }

  // 4. Fetch subject to resolve topic names
  const subject = await db.collection("SUBJECTS").findOne({ _id: subjectId });

  const topicsMap = new Map<string, string>();
  if (subject?.topics && Array.isArray(subject.topics)) {
    for (const topic of subject.topics) {
      // Topics can be stored as { _id, name } objects
      if (topic && typeof topic === "object" && topic._id) {
        topicsMap.set(topic._id.toString(), topic.name ?? "Sconosciuto");
      }
    }
  }

  // 5. Build result
  const topicsPerformance: TopicPerformance[] = [];
  for (const [topicId, { totalScore, totalPoints }] of topicTotals.entries()) {
    if (totalPoints === 0) continue;
    topicsPerformance.push({
      topicId,
      topicName: topicsMap.get(topicId) ?? "Sconosciuto",
      percentage: Math.round((totalScore / totalPoints) * 100),
    });
  }

  return { topicsPerformance };
};

export const handler = lambdaRequest(getClassTopicsPerformance);
