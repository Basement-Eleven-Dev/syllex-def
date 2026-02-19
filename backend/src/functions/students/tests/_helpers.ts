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

function sanitizeQuestionIds(question: any): any {
  if (!question) return question;

  const sanitized = { ...question };
  const objectIdFields = ["_id", "subjectId", "teacherId", "topicId"];

  for (const field of objectIdFields) {
    if (sanitized[field] && typeof sanitized[field] === "string") {
      try {
        sanitized[field] = new ObjectId(sanitized[field]);
      } catch {
        // Keep as-is if not a valid ObjectId
      }
    }
  }

  return sanitized;
}
