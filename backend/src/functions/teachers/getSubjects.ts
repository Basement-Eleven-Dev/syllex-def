import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { Subject } from "../../models/subject";
import { ObjectId } from "mongodb";

const getTeacherSubjects = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const teacherId: ObjectId = new ObjectId(request.pathParameters!.teacherId!);
  const db = await getDefaultDatabase();
  const topics = await db
    .collection("topics")
    .find({ teacherId: teacherId })
    .toArray();
  const subjects = await db
    .collection<Subject>("SUBJECTS")
    .find({ teacherId: teacherId })
    .toArray();
  return subjects;
};
export const handler = lambdaRequest(getTeacherSubjects);
