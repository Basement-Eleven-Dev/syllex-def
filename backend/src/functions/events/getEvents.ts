import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Class } from "../../models/schemas/class.schema";
import { TeacherAssignment } from "../../models/schemas/teacher-assignment.schema";
import { Event } from '../../models/schemas/event.schema'
const getEvents = async (request: APIGatewayProxyEvent, context: Context) => {
  await connectDatabase();

  const { month, year } = request.queryStringParameters || {};

  const filter: any = {};

  // Logica di filtraggio basata sul ruolo
  if (context.user?._id) {
    if (context.user.role === "teacher") {
      // Un docente vede solo i suoi eventi
      filter.teacherId = context.user._id;
    } else if (context.user.role === "student") {
      // Uno studente vede solo gli eventi delle materie in cui è iscritto
      const studentClasses = await Class
        .find({ students: context.user._id } as any)

      const classIds = studentClasses.map((c) => c._id);
      const assignments = await TeacherAssignment
        .find({ classId: { $in: classIds } } as any)

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

  const events = await Event
    .find(filter)
    .sort({ date: 1 })

  return { events };
};

export const handler = lambdaRequest(getEvents);
