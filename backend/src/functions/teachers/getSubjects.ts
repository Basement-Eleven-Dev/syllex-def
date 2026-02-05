import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { Subject } from "../../models/subject";
import { ObjectId } from "mongodb";


const getTeacherSubjects = async (event: APIGatewayProxyEvent, context: Context) => {
    const teacherId: ObjectId = new ObjectId(event.pathParameters!.teacherId!)
    const db = await getDefaultDatabase();
    const subjects = await db.collection<Subject>('subjects').find({ teacherId: teacherId }).toArray();
    return subjects
}
export const handler = lambdaRequest(getTeacherSubjects)