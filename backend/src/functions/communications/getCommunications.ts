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
    subjectId = "",
  } = request.queryStringParameters || {};

  const currentPage = parseInt(page, 10);
  const currentPageSize = parseInt(pageSize, 10);
  const skip = (currentPage - 1) * currentPageSize;

  // Costruisco il filtro per MongoDB
  const filter: any = {};

  // Logica di filtraggio basata sul ruolo
  if (context.user?._id) {
    if (context.user.role === "teacher") {
      // Un docente vede solo le sue comunicazioni
      filter.teacherId = context.user._id;
    } else if (context.user.role === "student") {
      // Uno studente vede solo le comunicazioni delle sue classi
      const studentClasses = await db
        .collection("classes")
        .find({ students: { $in: [context.user._id] } })
        .toArray();

      const classIds = studentClasses.map((c) => c._id);
      filter.classIds = { $in: classIds };
    }
  }

  // Filtraggio per materia
  if (subjectId) {
    filter.subjectId = new ObjectId(subjectId);
  } else if (context.subjectId) {
    // se non è passata via query, ma c'è nel contesto (es. endpoint annidato), filtro per quella
    filter.subjectId = context.subjectId;
  }
  // Se non c'è subjectId e non siamo in un contesto di materia, lo studente vede tutto quello che appartiene alle sue classi

  // Ricerca testuale su titolo e contenuto
  if (searchTerm) {
    filter.$or = [
      { title: { $regex: searchTerm, $options: "i" } },
      { content: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // Filtro per classe specifica (se richiesto esplicitamente oltre al filtro di ruolo)
  if (classId) {
    const targetClassId = new ObjectId(classId);
    if (filter.classIds) {
      // se c'è già un filtro (es. studente), facciamo intersezione manuale o usiamo $and
      filter.$and = [{ classIds: targetClassId }, { classIds: filter.classIds }];
      delete filter.classIds;
    } else {
      filter.classIds = targetClassId;
    }
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
