import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { Subject } from "../../models/subject";
import { ObjectId } from "mongodb";

const getSubjectClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const subjectId: ObjectId = new ObjectId(request.pathParameters!.subjectId!);
  let teacherId = context.user?._id;
  const db = await getDefaultDatabase();
  const assignments = await db
    .collection("class_has_teacher")
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
