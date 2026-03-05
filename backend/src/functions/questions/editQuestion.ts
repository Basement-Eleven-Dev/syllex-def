import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const editQuestion = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const questionId = request.pathParameters?.questionId;

  if (!questionId) {
    throw createError.BadRequest("questionId is required");
  }

  const questionData = JSON.parse(request.body || "{}");

  const db = await getDefaultDatabase();
  const questionsCollection = db.collection("questions");

  // Verifica che la domanda esista e appartenga al teacher
  const existingQuestion = await questionsCollection.findOne({
    _id: new ObjectId(questionId),
    teacherId: context.user?._id,
  });

  if (!existingQuestion) {
    throw createError.NotFound("Question not found or not authorized");
  }

  // Prepara i dati per l'update
  const updateData: any = {
    text: questionData.text,
    type: questionData.type,
    explanation: questionData.explanation,
    policy: questionData.policy,
    updatedAt: new Date(),
  };

  if (questionData.topicId) {
    updateData.topicId = new ObjectId(questionData.topicId);
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

  // Update della domanda
  await questionsCollection.updateOne(
    { _id: new ObjectId(questionId) },
    { $set: updateData },
  );

  // Ritorna la domanda aggiornata
  const updatedQuestion = await questionsCollection.findOne({
    _id: new ObjectId(questionId),
  });

  return {
    question: updatedQuestion,
  };
};

export const handler = lambdaRequest(editQuestion);
