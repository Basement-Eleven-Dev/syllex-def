import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { Question } from "../../models/question";

const getQuestions = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const db = await getDefaultDatabase();
  const questionsCollection = db.collection<Question>("questions");

  // Estraggo i parametri dalla query string
  const {
    searchTerm = "",
    type = "",
    topicId = "",
    policy = "",
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

  if (searchTerm) {
    filter.text = { $regex: searchTerm, $options: "i" }; // Case-insensitive search
  }

  if (type) {
    filter.type = type;
  }

  if (topicId) {
    filter.topicId = new ObjectId(topicId);
  }

  if (policy && (policy === "pubblica" || policy === "privata")) {
    filter.policy = policy;
  }

  // Query con paginazione
  const questions = await questionsCollection
    .find(filter)
    .skip(skip)
    .limit(currentPageSize)
    .toArray();

  // Conto il totale per la paginazione
  const total = await questionsCollection.countDocuments(filter);

  return {
    questions,
    total,
  };
};

export const handler = lambdaRequest(getQuestions);
