import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getCommunications = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const db = await getDefaultDatabase();
  const communicationsCollection = db.collection("communications");

  // Estraggo i parametri dalla query string
  const {
    searchTerm = "",
    classId = "",
    hasAttachments = "",
    page = "1",
    pageSize = "10",
  } = request.queryStringParameters || {};

  const currentPage = parseInt(page, 10);
  const currentPageSize = parseInt(pageSize, 10);
  const skip = (currentPage - 1) * currentPageSize;

  // Costruisco il filtro per MongoDB
  const filter: any = {};

  // Solo comunicazioni del teacher loggato
  if (context.user?._id) {
    filter.teacherId = context.user._id;
  }

  // Filtro per subjectId (discriminante fondamentale)
  const { subjectId } = request.queryStringParameters || {};
  if (subjectId) {
    filter.subjectId = new ObjectId(subjectId);
  }

  // Ricerca testuale su titolo e contenuto
  if (searchTerm) {
    filter.$or = [
      { title: { $regex: searchTerm, $options: "i" } },
      { content: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // Filtro per classe specifica
  if (classId) {
    filter.classIds = new ObjectId(classId);
  }

  // Filtro per presenza allegati
  if (hasAttachments === "true") {
    filter.materialIds = { $exists: true, $ne: [] };
  } else if (hasAttachments === "false") {
    filter.$or = [
      { materialIds: { $exists: false } },
      { materialIds: { $size: 0 } },
    ];
  }

  // Query con paginazione, ordinata per data (più recenti prima)
  const communications = await communicationsCollection
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(currentPageSize)
    .toArray();

  // Conto il totale per la paginazione
  const total = await communicationsCollection.countDocuments(filter);

  return {
    communications,
    total,
  };
};

export const handler = lambdaRequest(getCommunications);
