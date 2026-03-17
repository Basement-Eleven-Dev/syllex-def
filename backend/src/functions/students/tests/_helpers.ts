import { Types, mongo } from "mongoose";
import { AttemptQuestion } from "../../../models/schemas/attempt.schema";

/**
 * Converts string IDs within question objects back to ObjectIds
 * for proper MongoDB storage.
 */
export function sanitizeAttemptQuestions(questions: any[]): AttemptQuestion[] {
  return questions.map((q) => ({
    question: sanitizeObjectIds(q.question),
    answer: q.answer as string,
    score: 0,
    points: (q.points as number) ?? 0,
  }));
}

function toObjectId(value: any): Types.ObjectId | undefined {
  if (!value) return undefined;
  // Plain string ("abc123...")
  if (typeof value === "string") {
    try {
      return new mongo.ObjectId(value);
    } catch {
      return undefined;
    }
  }
  // EJSON extended format: { $oid: "abc123..." }
  if (typeof value === "object" && typeof value.$oid === "string") {
    try {
      return new mongo.ObjectId(value.$oid);
    } catch {
      return undefined;
    }
  }
  // Already an ObjectId instance
  if (value instanceof mongo.ObjectId) return value;
  return undefined;
}

function sanitizeObjectIds(question: any): AttemptQuestion['question'] {
  if (!question) return question;

  const sanitized = { ...question };
  const objectIdFields = ["_id", "subjectId", "teacherId", "topicId"];

  for (const field of objectIdFields) {
    const converted = toObjectId(sanitized[field]);
    if (converted) sanitized[field] = converted;
  }

  return sanitized;
}
