import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

const getStudentSubjectClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const subjectId = context.subjectId!;
  const studentId = context.user?._id;
  const db = await getDefaultDatabase();

  // Recupera le classi dello studente in cui è insegnata questa materia
  const studentClasses = await db
    .collection("classes")
    .find({
      students: { $in: [studentId] },
      subjects: { $in: [subjectId] },
    })
    .toArray();

  return studentClasses;
};
export const handler = lambdaRequest(getStudentSubjectClasses);
