import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";

const getStudentMaterials = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = context.user?._id;
  if (!studentId) {
    return { success: false, message: "Unauthorized" };
  }

  const subjectId = context.subjectId;
  if (!subjectId) {
    return { success: false, message: "Subject-Id header is required" };
  }

  const db = await getDefaultDatabase();

  // Recupera le classi dello studente
  const classes = await db
    .collection("classes")
    .find({ students: { $in: [studentId] } })
    .toArray();

  if (classes.length === 0) {
    return { success: true, materials: [] };
  }

  const classIds = classes.map((c) => c._id);
  console.log(classIds);

  // Recupera i materiali della materia selezionata che sono accessibili alle classi dello studente
  const materials = await db
    .collection("materials")
    .find({
      subjectId: subjectId,
      classIds: { $in: classIds },
      type: "file",
    })
    .toArray();

  return {
    success: true,
    materials,
  };
};

export const handler = lambdaRequest(getStudentMaterials);
