import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";
import { Types, mongo } from "mongoose";
import { fetchBuffer } from "../../_helpers/fetchBuffer";
import { extractTextFromFile } from "../../_helpers/documents/extractTextFromFile";
import { suggestNewTopics } from "../../_helpers/AI/suggestNewTopics";
import { Material } from "../../models/schemas/material.schema";
import { Subject, SubjectView } from "../../models/schemas/subject.schema";

const createMaterial = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  await connectDatabase();

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

  // Check storage limit (1GB)
  const STORAGE_LIMIT_B = 1024 * 1024 * 1024;
  const materials = await Material.find({
    teacherId: teacherId as any,
    subjectId: context.subjectId as any,
  });

  const totalBytes = materials.reduce((acc, m) => acc + (m.byteSize || 0), 0);
  if (totalBytes >= STORAGE_LIMIT_B) {
    throw createError(
      400,
      "Limite di archiviazione (1GB) raggiunto per questa materia.",
    );
  }

  // Prepare material data
  const materialData = {
    ...body.material,
    teacherId,
    subjectId: context.subjectId,
  };
  delete materialData._id;

  // Insert material into database
  const material = await Material.create(materialData);

  // If parentId is provided, add material to parent folder
  if (body.parentId) {
    const parentId = new mongo.ObjectId(body.parentId as string);

    // Validate parent folder exists and belongs to the teacher
    const parentFolder = await Material.findOne({
      _id: parentId as any,
      teacherId: teacherId as any,
      type: "folder",
    });

    if (!parentFolder) {
      throw createError(404, "Cartella padre non trovata");
    }

    // Add material to parent folder's content
    await Material.updateOne(
      { _id: parentId as any, teacherId: teacherId as any },
      { $push: { content: material._id } },
    );
  }
  let suggestedTopics: string[] = [];
  if (material.type !== "folder" && material.url) {
    try {
      // Start indexing in background (existing logic)
      const { startIndexingJob } =
        await import("../../_triggers/backgroundVectorize");
      await startIndexingJob(material._id as any);

      // Topic Discovery
      const subject = await SubjectView.findOne({
        _id: context.subjectId as any,
      });

      if (subject && material.url) {
        const buffer = await fetchBuffer(material.url);
        const textExtracted = await extractTextFromFile(
          buffer,
          material.extension || "",
        );

        if (textExtracted && textExtracted.trim().length > 0) {
          suggestedTopics = await suggestNewTopics(
            textExtracted,
            subject.topics.map((el) => el.name),
            subject.name,
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
    material: material.toObject(),
    suggestedTopics,
  };
};

export const handler = lambdaRequest(createMaterial);
