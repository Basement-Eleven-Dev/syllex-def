import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { startIndexingJob } from "../../_triggers/backgroundVectorize";

const createMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  // Parse and validate request body
  const body = JSON.parse(request.body || "{}");
  console.log("Received createMaterial request with body:", body);

  if (!body.material) {
    throw createError(400, "I dati del materiale sono richiesti");
  }

  if (!context.subjectId) {
    throw createError(400, "subjectId è richiesto");
  }

  const teacherId = context.user?._id;

  // Get database connection
  const db = await getDefaultDatabase();
  const materialsCollection = db.collection("materials");

  // Prepare material data
  const material = {
    ...body.material,
    createdAt: new Date(),
    teacherId,
    subjectId: context.subjectId,
  };
  delete material._id;

  // Insert material into database
  const insertResult = await materialsCollection.insertOne(material);
  material._id = insertResult.insertedId;

  // If parentId is provided, add material to parent folder
  if (body.parentId) {
    const parentId = new ObjectId(body.parentId);

    // Validate parent folder exists and belongs to the teacher
    const parentFolder = await materialsCollection.findOne({
      _id: parentId,
      teacherId,
      type: "folder",
    });

    if (!parentFolder) {
      throw createError(404, "Cartella padre non trovata");
    }

    // Add material to parent folder's content
    await materialsCollection.updateOne({ _id: parentId, teacherId }, {
      $push: { content: material._id },
    } as any);
  }
  if (material.type !== "folder") {
    await startIndexingJob(material._id);
  }

  return {
    success: true,
    material,
  };
};

export const handler = lambdaRequest(createMaterial);
