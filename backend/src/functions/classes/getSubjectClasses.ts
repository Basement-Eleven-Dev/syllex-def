import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";


const getSubjectClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const subjectId = context.subjectId!;
  const userId = context.user?._id;
  const db = await getDefaultDatabase();
  if (context.user?.role == 'student') return await db
    .collection("classes")
    .find({
      students: { $in: [userId] },
      subjects: { $in: [subjectId] },
    })
    .toArray();
  const assignments = await db
    .collection("teacher_assignments")
    .find({ teacherId: userId, subjectId: subjectId })
    .toArray();

  const classIds = assignments.map((assignment) => assignment.classId);
  const classes = await db
    .collection("classes")
    .find({ _id: { $in: classIds } })
    .toArray();

  return classes;
};
export const handler = lambdaRequest(getSubjectClasses);
