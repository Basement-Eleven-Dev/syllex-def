import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import { Db, ObjectId } from "mongodb";
import { getRagResponse } from "../../_helpers/_ai-aws/assistant.service";
import { extractJsonFromResponse } from "../../_helpers/_ai-aws/ai-utils";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";
import { MaterialDocument } from "../materials/createMaterialWithFiles";

interface TopicsByMaterial {
  materialId: string;
  materialTitle: string;
  topics: string[];
}

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "teacher") {
    return res.status(403).json({ message: "Access denied." });
  }

  const { materialIds: materialIdsInput, language = "italian" } = JSON.parse(
    req.body || "{}"
  );
  const materialIds = Array.isArray(materialIdsInput) ? materialIdsInput : [];

  if (materialIds.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one material ID is required." });
  }

  try {
    const db: Db = (await mongoClient()).db(DB_NAME);
    const materialsCollection = db.collection<MaterialDocument>("materials");
    const classesCollection = db.collection("classes");
    const materialObjectIds = materialIds.map((id: string) => new ObjectId(id));

    // --- NUOVA LOGICA DI AUTORIZZAZIONE ---

    // 1. Troviamo prima tutte le materie a cui il docente ha accesso
    const assignments = await classesCollection
      .aggregate([
        { $match: { "teachingAssignments.teacherId": user._id } },
        { $unwind: "$teachingAssignments" },
        { $match: { "teachingAssignments.teacherId": user._id } },
        { $group: { _id: "$teachingAssignments.subjectId" } },
      ])
      .toArray();
    const accessibleSubjectIds = assignments.map((a) => a._id);

    // 2. Ora recuperiamo i materiali richiesti, ma solo se appartengono a una materia che il docente insegna
    const materials = await materialsCollection
      .find({
        _id: { $in: materialObjectIds },
        subjectId: { $in: accessibleSubjectIds }, // Filtro di sicurezza
      })
      .toArray();

    // ------------------------------------

    if (materials.length === 0) {
      return res.status(404).json({
        message:
          "Nessun materiale trovato o non sei autorizzato ad analizzarli.",
      });
    }

    const topicsByMaterial: TopicsByMaterial[] = [];

    for (const material of materials) {
      // La tua eccellente logica di caching e generazione rimane INVARIATA
      let topicsForThisMaterial: string[] = [];
      const languageCode = language.substring(0, 2);
      let topicsObject: { [key: string]: string[] } = material.topics || {};
      // -------------------------------------------------------------------------

      if (Array.isArray(topicsObject)) {
        const oldTopics = topicsObject as any[]; // Cast temporaneo per la migrazione
        topicsObject = { it: oldTopics };
      }

      if (topicsObject[languageCode] && topicsObject[languageCode].length > 0) {
        topicsForThisMaterial = topicsObject[languageCode];
      } else {
        // Cache Miss: I topic non esistono, li generiamo con RAG

        const systemPrompt = `You are an expert academic analyst. Your task is to identify and extract the most important narrative and conceptual topics from a document.

**CRITICAL RULES:**
1.  **FOCUS:** Extract specific, concrete topics. Focus on characters, events, locations, and key definitions mentioned in the text. AVOID overly abstract or philosophical themes. For example, for "The Divine Comedy", a good topic is "Virgil's role as a guide", a bad topic is "The concept of divine justice".
2.  **SOURCE:** Your ONLY source is the provided context. DO NOT use general knowledge.
3.  **LANGUAGE:** Your entire JSON output MUST be in **${language}**.
4.  **OUTPUT FORMAT:** Your response must be ONLY a valid JSON object with a single root key "topics". The value must be an array of up to 10 strings.`;

        const userQueryForRag = `Identify the main topics from the provided context.`;

        const aiResponseString = await getRagResponse(
          userQueryForRag,
          [material._id.toString()],
          systemPrompt,
          'topic-extraction'
        );
        const result = extractJsonFromResponse(aiResponseString);
        const newTopics = result?.topics || [];

        if (newTopics.length > 0) {
          topicsForThisMaterial = newTopics;
          // Salviamo i nuovi topic nel database usando la notazione a punto per la lingua specifica
          await materialsCollection.updateOne(
            { _id: material._id },
            {
              $set: {
                [`topics.${languageCode}`]: newTopics,
                updatedAt: new Date(),
              },
            }
          );
        }
      }

      if (topicsForThisMaterial.length > 0) {
        topicsByMaterial.push({
          materialId: material._id.toString(),
          materialTitle: material.title,
          topics: topicsForThisMaterial,
        });
      }
    }

    return res.status(200).json({ topicsByMaterial: topicsByMaterial });
  } catch (error: any) {
    console.error("[ExtractTopics] Error:", { message: error.message });
    return res.status(500).json({
      message: "Server error during topic extraction.",
      error: error.message,
    });
  }
};
