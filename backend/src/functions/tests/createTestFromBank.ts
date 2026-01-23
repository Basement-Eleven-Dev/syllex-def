import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_types/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";
import { DB_NAME } from "../../_helpers/config/env";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../../_helpers/getDatabase";
import { getAnthropicResponse } from "../../_helpers/_ai-aws/assistant.service";
import { extractJsonFromResponse } from "../../_helpers/_ai-aws/ai-utils";
import { extractTextFromS3File } from "../../_helpers/_utils/file.utils";
import { Test } from "./createTest";

// Funzione di utilità per mescolare un array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Crea un test estraendo domande da un file (banca dati) precedentemente caricato su S3.
 */
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

  // MODIFICA 1: La funzione ora accetta i nuovi campi dal body
  const { title, numQuestions, fileInfo, subjectId, organizationId } =
    JSON.parse(req.body || "{}");
  const { storagePath, mimetype } = fileInfo || {};

  // Validazione aggiornata
  if (!title || !fileInfo || !storagePath || !mimetype) {
    return res
      .status(400)
      .json({ message: "Informazioni sul test o sul file mancanti." });
  }
  if (!subjectId || !ObjectId.isValid(subjectId)) {
    return res.status(400).json({
      message: "È necessario specificare una materia (subjectId) valida.",
    });
  }
  if (!organizationId || !ObjectId.isValid(organizationId)) {
    return res.status(400).json({
      message:
        "È necessario specificare un'organizzazione (organizationId) valida.",
    });
  }

  const BUCKET_NAME = process.env.BUCKET_NAME;
  if (!BUCKET_NAME) {
    throw new Error("Nome del bucket S3 non configurato.");
  }

  try {
    const fileContent = await extractTextFromS3File(
      BUCKET_NAME,
      storagePath,
      mimetype
    );

    if (fileContent.trim() === "") {
      return res
        .status(400)
        .json({ message: "Impossibile estrarre testo dal file fornito." });
    }

    // 3.logica di parsing
    const questionBlocks = fileContent
      .split(/\n\s*(?=\d+\s*[\.\)])/)
      .filter((block) => block.trim() !== "");

    if (questionBlocks.length === 0) {
      return res.status(500).json({
        message:
          "Nessuna domanda trovata nel documento. Controlla il formato della numerazione (es. '1. Domanda...').",
      });
    }

    const numQuestionsToExtract = numQuestions || 10;
    shuffleArray(questionBlocks);
    const selectedBlocks = questionBlocks.slice(0, numQuestionsToExtract);

    // 4. Esegue una singola chiamata "batch" all'AI per formattare tutte le domande
    const systemPrompt = `You are a data parser. Your task is to parse an array of text blocks, each containing a single question and its options, into a valid JSON array of objects.`;
    const userPrompt = `The following is a JSON array of strings. Each string contains ONE question and its options. Assume the first option listed in each block is the correct answer. Parse every block into a JSON object with these exact keys: "questionText", "options" (array of all option strings), "correctAnswer" (the text of the first option). Your entire output MUST be a single JSON array containing the parsed objects.\n\nTEXT BLOCKS TO PARSE:\n${JSON.stringify(
      selectedBlocks,
      null,
      2
    )}`;

    const jsonString = await getAnthropicResponse(
      systemPrompt,
      userPrompt,
      true,
      'test-creation'
    );
    const allParsedQuestions = extractJsonFromResponse(jsonString);

    if (!Array.isArray(allParsedQuestions)) {
      throw new Error(
        "La risposta batch dell'AI non era un array JSON valido."
      );
    }

    // 5. Finalizza le domande e crea il documento del test
    let totalPoints = 0;
    const finalQuestions = allParsedQuestions
      .map((q: any) => {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2)
          return null;

        const points = 1;
        totalPoints += points;
        const correctAnswerText = q.correctAnswer || q.options[0];
        const shuffledOptions = shuffleArray([...q.options]).map(
          (opt: string) => ({ text: opt })
        );

        return {
          _id: new ObjectId(),
          questionText: q.questionText,
          questionType: "multiple-choice" as const,
          options: shuffledOptions,
          correctAnswer: correctAnswerText,
          points: points,
          explanation: `La risposta corretta è "${correctAnswerText}".`,
          aiGenerated: true,
        };
      })
      .filter((q): q is any => q !== null);

    if (finalQuestions.length === 0) {
      return res
        .status(500)
        .json({ message: "Elaborazione delle domande fallita." });
    }

    const newTestData: Omit<Test, "_id"> = {
      title: title.trim(),
      subjectId: new ObjectId(subjectId),
      organizationId: new ObjectId(organizationId),

      teacherId: user._id, //DA RIMUOVERE

      questions: finalQuestions,
      status: "published",
      totalPoints: totalPoints,
      language: "italian",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db: Db = (await mongoClient()).db(DB_NAME);
    const result = await db.collection("tests").insertOne(newTestData);
    const savedTest = await db
      .collection("tests")
      .findOne({ _id: result.insertedId });

    if (!savedTest)
      throw new Error("Impossibile recuperare il test dopo la creazione.");

    return res.status(201).json({
      message: `Test "${title}" creato con successo con ${finalQuestions.length} domande!`,
      test: savedTest,
    });
  } catch (error: any) {
    console.error("Errore durante la creazione del test da banca dati:", error);
    return res.status(500).json({
      message: "Errore del server durante la creazione del test.",
      error: error.message,
    });
  }
};
