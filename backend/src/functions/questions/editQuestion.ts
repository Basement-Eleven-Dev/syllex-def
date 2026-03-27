import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { Question, QuestionUpdate } from "../../models/schemas/question.schema";

const editQuestion = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const questionId = request.pathParameters!.questionId!;

  const questionData = JSON.parse(request.body || "{}");

  await connectDatabase();

  // Prepara i dati per l'update
  const updateData: QuestionUpdate = {
    text: questionData.text,
    type: questionData.type,
    explanation: questionData.explanation,
    difficulty: questionData.difficulty || undefined,
    policy: questionData.policy,
    updatedAt: new Date(),
  };

  if (questionData.topicId) {
    updateData.topicId = new Types.ObjectId(questionData.topicId);
  }

  if (context.subjectId) {
    updateData.subjectId = context.subjectId;
  }

  // Gestione imageUrl: se è un URL esistente o un nuovo caricamento
  if (questionData.imageUrl) {
    updateData.imageUrl = questionData.imageUrl;
  }

  // Gestione opzioni per domande a scelta multipla
  if (questionData.type === "scelta multipla" && questionData.options) {
    updateData.options = questionData.options;
  }

  // Update della domanda (atomic: include ownership in filter)
  const updatedQuestion = await Question.findOneAndUpdate(
    { _id: questionId, teacherId: context.user?._id } as any,
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedQuestion) {
    throw createError.NotFound("Question not found or not authorized");
  }

  return {
    question: updatedQuestion,
  };
};

export const handler = lambdaRequest(editQuestion);
