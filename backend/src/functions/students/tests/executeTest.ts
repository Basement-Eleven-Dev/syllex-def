import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../../_helpers/getDatabase";
import { precorrectTest } from "../../../_helpers/student-test/precorrectTest";
import { Attempt } from "../../../models/schemas/attempt.schema";

const executeTests = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();
  const testExecutedData = JSON.parse(request.body || "{}");

  // Prova precorrezione automatica
  let score = undefined;
  let fitTestScore = undefined;
  let status = testExecutedData.status || "processing";
  let maxScore = testExecutedData.questions?.length || null;
  const fitScore =
    typeof testExecutedData.fitScore === "number"
      ? testExecutedData.fitScore
      : 1;
  const precorrect = precorrectTest({
    questions: testExecutedData.questions,
    fitScore,
  });
  if (precorrect) {
    score = precorrect.score;
    fitTestScore = precorrect.fitTestScore;
    status = precorrect.status;
  }

  const attempt = {
    testId: testExecutedData.testId,
    subjectId: testExecutedData.subjectId,
    teacherId: testExecutedData.teacherId,
    studentId: context.user?._id,
    deliveredAt: testExecutedData.deliveredAt
      ? new Date(testExecutedData.deliveredAt)
      : new Date(),
    reviewedAt: testExecutedData.reviewedAt
      ? new Date(testExecutedData.reviewedAt)
      : undefined,
    questions: testExecutedData.questions, // domande per esteso
    status,
    score,
    fitTestScore,
    maxScore,
    // altri campi opzionali se servono
  };

  const result = await Attempt.insertOne(attempt);
  return {
    success: true,
    attemptId: result._id,
  };
};

export const handler = lambdaRequest(executeTests);
