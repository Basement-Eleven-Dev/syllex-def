import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types } from "mongoose";
import { Question } from "../../models/schemas/question.schema";

const getQuestions = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

  // Estraggo i parametri dalla query string
  const {
    searchTerm = "",
    type = "",
    topicId = "",
    policy = "",
    difficulty = "",
    page = "1",
    pageSize = "10",
  } = request.queryStringParameters || {};

  const currentPage = parseInt(page, 10);
  const currentPageSize = parseInt(pageSize, 10);
  const skip = (currentPage - 1) * currentPageSize;

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

  if (searchTerm) {
    filter.text = { $regex: searchTerm, $options: "i" }; // Case-insensitive search
  }

  if (type) {
    filter.type = type;
  }

  if (topicId) {
    filter.topicId = new Types.ObjectId(topicId);
  }

  if (policy && (policy === "public" || policy === "private")) {
    filter.policy = policy;
  }

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  console.log("Filtro per getQuestions:", filter);

  // Query con paginazione
  const questions = await Question
    .find(filter)
    .skip(skip)
    .limit(currentPageSize)
    .sort({ createdAt: -1, _id: -1 })

  // Conto il totale per la paginazione
  const total = await Question.countDocuments(filter);

  return {
    questions,
    total,
  };
};

export const handler = lambdaRequest(getQuestions);
