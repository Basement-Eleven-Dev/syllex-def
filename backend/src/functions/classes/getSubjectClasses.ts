import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Class } from "../../models/schemas/class.schema";
import { TeacherAssignment } from "../../models/schemas/teacher-assignment.schema";


const getSubjectClasses = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const subjectId = context.subjectId!;
  const userId = context.user?._id;
  await connectDatabase();
  if (context.user?.role == 'student') return await Class
    .find({
      students: userId,
      subjects: subjectId,
    })
  const assignments = await TeacherAssignment
    .find({ teacherId: userId, subjectId: subjectId })

  const classIds = assignments.map((assignment) => assignment.classId);
  const classes = await Class
    .find({ _id: { $in: classIds } })

  return classes;
};
export const handler = lambdaRequest(getSubjectClasses);
