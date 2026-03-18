import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Material } from "../../models/schemas/material.schema";
import { Class } from "../../models/schemas/class.schema";

const getMaterials = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const user = context.user!;
  const userId = user._id;
  const subjectId = context.subjectId!
  await connectDatabase();

  if (user.role == 'student') {
    const classes = await Class
      .find({ students: { $in: [userId] } })

    if (classes.length === 0) {
      return { success: true, materials: [] };
    }

    const classIds = classes.map((c) => c._id);
    console.log(classIds);

    // Recupera i materiali della materia selezionata che sono accessibili alle classi dello studente
    const materials = await Material
      .find({
        subjectId: subjectId as any,
        classIds: { $in: classIds },
        type: "file",
      })
    return { materials }
  }
  // Query per ottenere tutti i materiali del teacher e della materia
  const query: any = { teacherId: userId as any };
  if (subjectId) {
    query.subjectId = subjectId as any;
  }

  // Aggregation per ottenere materiali con stato di vettorizzazione
  const materials = await Material
    .aggregate([
      { $match: query },
      {
        $lookup: {
          from: "file_embeddings",
          localField: "_id",
          foreignField: "referenced_file_id",
          pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
          as: "embeddings",
        },
      },
      {
        $addFields: {
          isVectorized: { $gt: [{ $size: "$embeddings" }, 0] },
        },
      },
      { $project: { embeddings: 0 } },
    ]);

  return {
    success: true,
    materials,
  };
};

export const handler = lambdaRequest(getMaterials);
