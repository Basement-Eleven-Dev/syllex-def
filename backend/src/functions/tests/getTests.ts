import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Class } from "../../models/schemas/class.schema";
import { Test } from "../../models/schemas/test.schema";

const getStudentTests = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  console.log("[BACKEND] getStudentTests chiamata!");
  await connectDatabase();

  // Estrai parametri per paginazione e filtri
  const {
    page = "1",
    pageSize = "10",
    status = "",
    subjectId = "",
    searchTerm = "",
  } = request.queryStringParameters || {};

  const currentPage = parseInt(page, 10);
  const currentPageSize = parseInt(pageSize, 10);
  const skip = (currentPage - 1) * currentPageSize;

  // Costruisci il filtro per MongoDB
  const filter: any = {};

  // Recupera tutte le classi dello studente
  const studentId = context.user?._id;
  if (!studentId) {
    return { tests: [], total: 0 };
  }
  const studentClasses = await Class
    .find({ students: new mongo.ObjectId(studentId) })
  const classIds = studentClasses.map((c) => c._id);

  // Include sia i test assegnati alle classi dello studente
  // sia i test di auto-valutazione generati dallo studente stesso
  const orConditions: any[] = [
    { source: "self-evaluation", studentId: new mongo.ObjectId(studentId) },
  ];
  if (classIds.length > 0) {
    orConditions.push({ classIds: { $in: classIds } });
  }
  filter.$or = orConditions;

  // Filtro per data di disponibilità: esclude test dove availableFrom è nel futuro
  const now = new Date();
  filter.$or = orConditions.map((condition) => ({
    ...condition,
    $or: [
      { availableFrom: { $exists: false } },
      { availableFrom: { $lte: now } },
    ],
  }));

  if (status) {
    filter.status = status;
  }

  if (subjectId) {
    filter.subjectId = new mongo.ObjectId(subjectId);
  }

  if (searchTerm && searchTerm.trim() !== "") {
    // Escape caratteri speciali regex
    const escapedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\\]\\]/g,
      "\\$&",
    );
    filter.name = { $regex: escapedSearchTerm, $options: "i" };
  }

  console.log("Filter applicato:", JSON.stringify(filter));

  // Esegui query con aggregation per includere subjectName
  const pipeline = [
    { $match: filter },
    { $sort: { createdAt: -1 as const } },
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "_subject",
      },
    },
    {
      $addFields: {
        subjectName: { $arrayElemAt: ["$_subject.name", 0] },
        isPasswordProtected: {
          $cond: [{ $gt: ["$password", null] }, true, false],
        },
        _id: { $toString: "$_id" },
      },
    },
    { $project: { _subject: 0, password: 0 } },
    { $skip: skip },
    { $limit: currentPageSize },
  ];

  const tests = await Test.aggregate(pipeline)

  // Conta totale per paginazione
  const total = await Test.countDocuments(filter);

  return {
    tests,
    total,
  };
};

const getTeacherTests = async (request: APIGatewayProxyEvent, context: Context) => {
  await connectDatabase();

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
  const tests = await Test
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
          _id: { $toString: "$_id" },
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

  console.log(`Trovati ${tests.length} test con aggregazione e filtro:`, filter);

  // Conta totale per paginazione
  const total = await Test.countDocuments(filter);

  return {
    tests,
    total,
  };
};

const getTests = async (request: APIGatewayProxyEvent, context: Context) => {
  if (context.user!.role == 'teacher') return getTeacherTests(request, context);
  return getStudentTests(request, context)

}

export const handler = lambdaRequest(getTests);
