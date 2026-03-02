import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getAllStudentClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = context.user?._id;
  const db = await getDefaultDatabase();

  // Recupera tutte le classi dello studente con le relative materie
  const studentClasses = await db
    .collection("classes")
    .find({ students: { $in: [studentId] } })
    .toArray();

  const classIds = studentClasses.map((c) => c._id);

  // Recupera le assegnazioni (materie) per queste classi
  const subjectAssignments = await db
    .collection("teacher_assignments")
    .find({ classId: { $in: classIds } })
    .toArray();

  const findClass = (classId: ObjectId) => {
    return studentClasses.find((cls) => cls._id.equals(classId));
  };

  let result = subjectAssignments.map((assignment) => {
    const classInfo = findClass(assignment.classId);
    return {
      class: classInfo,
      subjectId: assignment.subjectId,
    };
  });

  return result;
};
export const handler = lambdaRequest(getAllStudentClasses);
