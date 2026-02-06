import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";

const getStudents = async (request: APIGatewayProxyEvent, context: Context) => {
  const body = JSON.parse(request.body || "{}");

  let studentIds = body.studentIds;
  studentIds = studentIds.map((id: string) => new ObjectId(id));

  const db = await getDefaultDatabase();
  const studentsCollection = db.collection("students");
  const studentsData = await studentsCollection
    .find({
      _id: { $in: studentIds },
    })
    .toArray();

  return {
    students: studentsData,
  };
};

//Lambda Syntax that runs on api call
export const handler = lambdaRequest(getStudents);
