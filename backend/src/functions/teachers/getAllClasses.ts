import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { Subject } from "../../models/subject";
import { ObjectId } from "mongodb";
import { ClassHasTeacher } from "../../models/class_has_teacher";

const getTeacherClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  let teacherId = context.user?._id;
  const db = await getDefaultDatabase();
  const assignments = await db
    .collection<ClassHasTeacher>("class_has_teacher")
    .find({ teacherId: teacherId })
    .toArray();

  const classIds = assignments.map((assignment) => assignment.classId);
  const classes = await db
    .collection("classes")
    .find({ _id: { $in: classIds } })
    .toArray();

  return classes;
};
export const handler = lambdaRequest(getTeacherClasses);
