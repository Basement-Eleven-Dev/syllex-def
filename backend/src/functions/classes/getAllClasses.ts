import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { Class } from "../../models/schemas/class.schema";
import { TeacherAssignment } from "../../models/schemas/teacher-assignment.schema";


const getAllClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const userId = context.user?._id;
  await connectDatabase();
  let assignmentMatch: any = { teacherId: userId };
  if (context.user?.role == 'student') {
    const studentClasses = await Class
      .find({ students: userId })

    const classIds = studentClasses.map((c) => c._id);
    assignmentMatch = { classId: { $in: classIds } }
  }

  const assignments = await TeacherAssignment
    .find(assignmentMatch)

  const classIds = assignments.map((assignment) => assignment.classId);
  const classes = await Class
    .find({ _id: { $in: classIds } })

  const findClass = (classId: Types.ObjectId) => {
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
export const handler = lambdaRequest(getAllClasses);
