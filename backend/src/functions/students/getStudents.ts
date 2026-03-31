import { APIGatewayProxyEvent, Context, Handler } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { User } from "../../models/schemas/user.schema";

const getStudents = async (request: APIGatewayProxyEvent, context: Context) => {
  const body = JSON.parse(request.body || "{}");

  let studentIds = body.studentIds;
  studentIds = studentIds.map((id: string) => new mongo.ObjectId(id));

  await connectDatabase();
  const studentsData = await User
    .find({
      _id: { $in: studentIds },
    })

  return {
    students: studentsData,
  };
};

//Lambda Syntax that runs on api call
export const handler = lambdaRequest(getStudents);
