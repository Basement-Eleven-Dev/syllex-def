import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { Question } from "../../models/schemas/question.schema";

const getAllQuestions = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();



  // Costruisco il filtro per MongoDB
  const filter: any = {};

  // Solo domande del teacher loggato (se è autenticato)
  if (context.user?._id) {
    filter.teacherId = context.user._id;
  }

  // Filtro per subjectId (discriminante fondamentale)
  if (context.subjectId) {
    filter.subjectId = context.subjectId;
  }


  console.log("Filtro per getQuestions:", filter);

  // Query con paginazione
  const questions = await Question.find(filter);

  // Conto il totale per la paginazione
  const total = await Question.countDocuments(filter);

  return {
    questions,
    total,
  };
};

export const handler = lambdaRequest(getAllQuestions);
