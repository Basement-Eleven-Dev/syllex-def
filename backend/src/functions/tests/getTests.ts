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
    searchTerm = "",
  } = request.queryStringParameters || {};

  const currentPage = parseInt(page, 10);
  const currentPageSize = parseInt(pageSize, 10);
  const skip = (currentPage - 1) * currentPageSize;

  // Costruisci il filtro per MongoDB
  const filter: any = {};

  // Solo test del teacher loggato
  if (context.user?._id) {
    filter.teacherId = context.user._id;
  }

  if (status) {
    filter.status = status;
  }

  if (context.subjectId) {
    filter.subjectId = context.subjectId;
  }

  if (searchTerm && searchTerm.trim() !== "") {
    // Escape caratteri speciali regex
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.name = { $regex: escapedSearchTerm, $options: "i" };
  }

  console.log("Filter applicato:", JSON.stringify(filter));

  // Esegui query con aggregazione per contare i compiti da correggere
  const tests = await testsCollection
    .aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: currentPageSize },
      {
        $lookup: {
          from: "attempts",
          localField: "_id",
          foreignField: "testId",
          as: "testAttempts",
        },
      },
      {
        $addFields: {
          uncorrectedCount: {
            $size: {
              $filter: {
                input: "$testAttempts",
                as: "attempt",
                cond: { $ne: ["$$attempt.status", "reviewed"] },
              },
            },
          },
        },
      },
      {
        $project: {
          testAttempts: 0,
        },
      },
    ])
    .toArray();

  console.log(`Trovati ${tests.length} test con aggregazione e filtro:`, filter);

  // Conta totale per paginazione
  const total = await testsCollection.countDocuments(filter);

  return {
    tests,
    total,
  };
};

export const handler = lambdaRequest(getTests);
