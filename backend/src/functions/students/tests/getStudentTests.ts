import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../../_helpers/getDatabase";
import { Test } from "../../../models/test";
import { ObjectId } from "mongodb";

const getStudentTests = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  console.log("[BACKEND] getStudentTests chiamata!");
  const db = await getDefaultDatabase();
  const testsCollection = db.collection<Test>("tests");

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
  const classesCollection = db.collection("classes");
  const studentClasses = await classesCollection
    .find({ students: new ObjectId(studentId) })
    .toArray();
  const classIds = studentClasses.map((c) => c._id);

  // Include sia i test assegnati alle classi dello studente
  // sia i test di auto-valutazione generati dallo studente stesso
  const orConditions: any[] = [
    { source: "self-evaluation", studentId: new ObjectId(studentId) },
  ];
  if (classIds.length > 0) {
    orConditions.push({ classIds: { $in: classIds } });
  }
  filter.$or = orConditions;

  if (status) {
    filter.status = status;
  }

  if (subjectId) {
    filter.subjectId = new ObjectId(subjectId);
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
      },
    },
    { $project: { _subject: 0 } },
    { $skip: skip },
    { $limit: currentPageSize },
  ];

  const tests = await testsCollection.aggregate(pipeline).toArray();

  // Conta totale per paginazione
  const total = await testsCollection.countDocuments(filter);

  return {
    tests,
    total,
  };
};

export const handler = lambdaRequest(getStudentTests);
