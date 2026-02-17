import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

const getStudentSubjects = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = context.user?._id;
  if (!studentId) {
    return { success: false, message: "Unauthorized" };
  }

  const db = await getDefaultDatabase();

  const classes = await db
    .collection("classes")
    .find({
      students: { $in: [studentId] },
    })
    .toArray();

  if (classes.length === 0) {
    return { success: true, subjects: [] };
  }

  const classIds = classes.map((c) => c._id);

  // 2. Trova le materie associate a queste classi via teacher_assignments
  const assignments = await db
    .collection("teacher_assignments")
    .find({
      classId: { $in: classIds },
    })
    .toArray();

  if (assignments.length === 0) {
    return { success: true, subjects: [] };
  }

  const subjectIds = assignments.map((a) => a.subjectId);

  // 3. Recupera i dettagli delle materie
  // Nota: Dalle ricerche precedenti il nome della collezione sembra essere "SUBJECTS"
  const subjects = await db
    .collection("SUBJECTS")
    .find({
      _id: { $in: subjectIds },
    })
    .toArray();

  return {
    success: true,
    subjects,
  };
};

export const handler = lambdaRequest(getStudentSubjects);
