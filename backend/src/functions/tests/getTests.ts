import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { Test } from "../../models/test";

const getTests = async (request: APIGatewayProxyEvent, context: Context) => {
  const db = await getDefaultDatabase();
  const testsCollection = db.collection<Test>("tests");

  // Estrai parametri per paginazione e filtri
  const {
    page = "1",
    pageSize = "10",
    status = "",
    subjectId = "",
  } = request.queryStringParameters || {};

  const currentPage = parseInt(page, 10);
  const currentPageSize = parseInt(pageSize, 10);
  const skip = (currentPage - 1) * currentPageSize;

  // Costruisci il filtro per MongoDB
  const filter: any = {
    teacherId: context.user?._id,
  };

  if (status) {
    filter.status = status;
  }

  if (subjectId) {
    filter.subjectId = subjectId;
  }

  // Esegui query con paginazione
  const tests = await testsCollection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(currentPageSize)
    .toArray();

  // Conta totale per paginazione
  const total = await testsCollection.countDocuments(filter);

  return {
    tests,
    total,
  };
};

export const handler = lambdaRequest(getTests);
