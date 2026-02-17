import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

const getSubjectClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const subjectId = context.subjectId!;
  let teacherId = context.user?._id;
  const db = await getDefaultDatabase();
  const assignments = await db
    .collection("teacher_assignments")
    .find({ teacherId: teacherId, subjectId: subjectId })
    .toArray();

  const classIds = assignments.map((assignment) => assignment.classId);
  const classes = await db
    .collection("classes")
    .find({ _id: { $in: classIds } })
    .toArray();

  return classes;
};
export const handler = lambdaRequest(getSubjectClasses);
