import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { fetchBuffer } from "../../_helpers/fetchBuffer";
import { extractTextFromFile } from "../../_helpers/documents/extractTextFromFile";
import { suggestNewTopics } from "../../_helpers/AI/suggestNewTopics";
import { Subject } from "../../models/subject";

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

  // Check storage limit (1GB)
  const STORAGE_LIMIT_B = 1024 * 1024 * 1024;
  const materials = await materialsCollection.find({
    teacherId,
    subjectId: context.subjectId as any,
  }).toArray();

  const totalBytes = materials.reduce((acc, m) => acc + (m.byteSize || 0), 0);
  if (totalBytes >= STORAGE_LIMIT_B) {
    throw createError(400, "Limite di archiviazione (1GB) raggiunto per questa materia.");
  }

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
    const parentId = new ObjectId(body.parentId as string);

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
  let suggestedTopics: string[] = [];
  if (material.type !== "folder" && material.url) {
    try {
      // Start indexing in background (existing logic)
      const { startIndexingJob } = await import("../../_triggers/backgroundVectorize");
      await startIndexingJob(material._id);

      // Topic Discovery
      const subject = (await db
        .collection("subjects")
        .findOne({ _id: context.subjectId as any })) as Subject;

      if (subject) {
        const buffer = await fetchBuffer(material.url);
        const textExtracted = await extractTextFromFile(buffer, material.extension);
        
        if (textExtracted && textExtracted.trim().length > 0) {
          suggestedTopics = await suggestNewTopics(
            textExtracted,
            subject.topics || [],
            subject.name
          );
        }
      }
    } catch (discoveryError) {
      console.error("Error during topic discovery:", discoveryError);
      // Don't fail the whole request if discovery fails
    }
  }

  return {
    success: true,
    material,
    suggestedTopics,
  };
};

export const handler = lambdaRequest(createMaterial);
