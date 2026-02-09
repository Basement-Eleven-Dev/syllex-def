import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { Subject } from "../../models/subject";
import { ObjectId } from "mongodb";

const getAllTeacherClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  let teacherId = context.user?._id;
  const db = await getDefaultDatabase();
  const assignments = await db
    .collection("teacher_assignments")
    .find({ teacherId: teacherId })
    .toArray();

  const classIds = assignments.map((assignment) => assignment.classId);
  const classes = await db
    .collection("classes")
    .find({ _id: { $in: classIds } })
    .toArray();

  const findClass = (classId: ObjectId) => {
    return classes.find((cls) => cls._id.equals(classId));
  };

  let result = assignments.map((assignment) => {
    const classInfo = findClass(assignment.classId);
    return {
      class: classInfo,
      subjectId: assignment.subjectId,
    };
  });

  return result;
};
export const handler = lambdaRequest(getAllTeacherClasses);
