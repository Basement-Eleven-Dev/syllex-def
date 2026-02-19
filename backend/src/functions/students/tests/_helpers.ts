import { ObjectId } from "mongodb";
import { AttemptQuestion } from "../../../models/attempt";

/**
 * Converts string IDs within question objects back to ObjectIds
 * for proper MongoDB storage.
 */
export function sanitizeAttemptQuestions(questions: any[]): AttemptQuestion[] {
  return questions.map((q) => ({
    question: sanitizeQuestionIds(q.question),
    answer: q.answer ?? null,
    points: q.points ?? 0,
  }));
}

function toObjectId(value: any): ObjectId | undefined {
  if (!value) return undefined;
  // Plain string ("abc123...")
  if (typeof value === "string") {
    try {
      return new ObjectId(value);
    } catch {
      return undefined;
    }
  }
  // EJSON extended format: { $oid: "abc123..." }
  if (typeof value === "object" && typeof value.$oid === "string") {
    try {
      return new ObjectId(value.$oid);
    } catch {
      return undefined;
    }
  }
  // Already an ObjectId instance
  if (value instanceof ObjectId) return value;
  return undefined;
}

function sanitizeQuestionIds(question: any): any {
  if (!question) return question;

  const sanitized = { ...question };
  const objectIdFields = ["_id", "subjectId", "teacherId", "topicId"];

  for (const field of objectIdFields) {
    const converted = toObjectId(sanitized[field]);
    if (converted) sanitized[field] = converted;
  }

  return sanitized;
}
