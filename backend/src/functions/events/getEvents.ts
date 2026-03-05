import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getEvents = async (request: APIGatewayProxyEvent, context: Context) => {
  const db = await getDefaultDatabase();
  const eventsCollection = db.collection("events");

  const { month, year } = request.queryStringParameters || {};

  const filter: any = {};

  // Logica di filtraggio basata sul ruolo
  if (context.user?._id) {
    if (context.user.role === "teacher") {
      // Un docente vede solo i suoi eventi
      filter.teacherId = context.user._id;
    } else if (context.user.role === "student") {
      // Uno studente vede solo gli eventi delle materie in cui è iscritto
      const studentClasses = await db
        .collection("classes")
        .find({ students: { $in: [context.user._id] } })
        .toArray();

      const classIds = studentClasses.map((c) => c._id);
      const assignments = await db
        .collection("teacher_assignments")
        .find({ classId: { $in: classIds } })
        .toArray();

      const subjectIds = assignments.map((a) => a.subjectId);
      filter.subjectId = { $in: subjectIds };
    }
  }

  // Se siamo in un contesto di materia specifico, restringiamo ulteriormente
  if (context.subjectId) {
    filter.subjectId = context.subjectId;
  }

  if (month && year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    filter.date = {
      $gte: new Date(y, m, 1),
      $lt: new Date(y, m + 1, 1),
    };
  }

  const events = await eventsCollection
    .find(filter)
    .sort({ date: 1 })
    .toArray();

  return { events };
};

export const handler = lambdaRequest(getEvents);
