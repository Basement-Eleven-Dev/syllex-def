import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { Question } from "../../models/schemas/question.schema";

const createQuestionsBatch = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const body = JSON.parse(request.body || "{}");
  const questionsInput = Array.isArray(body) ? body : body.questions;

  if (!questionsInput || !Array.isArray(questionsInput)) {
    throw createError.BadRequest("A non-empty array of questions is required");
  }

  await connectDatabase();

  const now = new Date();
  const processedQuestions = questionsInput.map((q: any) => {
    const preparedQuestion = {
      ...q,
      topicId: new Types.ObjectId(q.topicId),
      teacherId: context.user?._id,
      subjectId: context.subjectId,
      createdAt: now,
      updatedAt: now,
    };

    if (
      preparedQuestion.sourceMaterialId &&
      Types.ObjectId.isValid(preparedQuestion.sourceMaterialId)
    ) {
      preparedQuestion.sourceMaterialId = new Types.ObjectId(
        preparedQuestion.sourceMaterialId,
      );
    } else {
      delete preparedQuestion.sourceMaterialId;
    }

    return preparedQuestion;
  });

  const results = await Question.insertMany(processedQuestions);

  return {
    success: true,
    questions: results,
  };
};

export const handler = lambdaRequest(createQuestionsBatch);
