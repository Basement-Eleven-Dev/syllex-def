import { getCurrentUser } from "../../_helpers/getAuthCognitoUser";

import { Db, ObjectId } from "mongodb";
import { DB_NAME } from "../../_helpers/config/env";

import { extractJsonFromResponse } from "../../_helpers/_ai-aws/ai-utils";

import { getRagResponse } from "../../_helpers/_ai-aws/assistant.service";
import {
  CorsEnabledAPIGatewayProxyResult,
  CustomHandler,
  Res,
} from "../../_helpers/_lambda/lambdaProxyResponse";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mongoClient } from "../../_helpers/getDatabase";

export const handler: CustomHandler = async (
  req: APIGatewayProxyEvent,
  $,
  $$,
  res: Res = new Res()
): Promise<CorsEnabledAPIGatewayProxyResult> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "student") {
    return res.status(403).json({ message: "Accesso negato." });
  }

  const {
    materialIds,
    numQuestions = 5,
    difficulty = "medium",
    language = "italian",
    questionTypes = ["multiple-choice"],
  } = JSON.parse(req.body || "{}");

  if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
    return res
      .status(400)
      .json({ message: "È necessario selezionare almeno un materiale." });
  }

  try {
    const systemPrompt = `You are an expert AI assistant for creating self-assessment quizzes. Your goal is to generate questions that help students test their understanding of key concepts.

      **CRITICAL RULES:**
      1.  **KNOWLEDGE SOURCE:** Your ONLY source of information is the provided context. It is FORBIDDEN to use your general knowledge.
      2.  **LANGUAGE:** Your entire JSON output MUST be written in **${language}**.
      3.  **NATURAL PHRASING:** Frame questions and explanations naturally. AVOID robotic phrases like "Based on the provided context...".
      4.  **DISTRACTOR QUALITY (for multiple-choice):** The incorrect options must be plausible and relevant. They must have a similar length and style to the correct answer.
      5.  **JSON FORMAT ONLY:** Your response must be ONLY a valid JSON array of question objects. The keys for each object MUST be in Italian: "tipo", "domanda", "opzioni", "risposta_corretta" (as the 0-based index of the correct option), and "spiegazione".
      6.  **CONSISTENCY:** The "spiegazione" MUST logically and directly justify why the option at the "risposta_corretta" index is correct.
      7.  **TRUE/FALSE QUESTIONS:** For "vero-falso" questions, the field "risposta_corretta" MUST always be exactly "Vero" or "Falso" (string, capitalized, no index or boolean).
      8.  **QUESTION TYPES:** Use exactly these values for "tipo": "multiple-choice" for multiple choice, "vero-falso" for true/false, "open-ended-short" for open questions.`;

    const requestedTypes = Array.isArray(questionTypes)
      ? questionTypes
      : [questionTypes];

    const userQueryForRag = `Generate ${numQuestions} self-assessment questions.
      - Difficulty: "${difficulty}".
      - Question Types: ${requestedTypes.join(", ")}.`;

    const aiResponseString = await getRagResponse(
      userQueryForRag,
      materialIds,
      systemPrompt,
      'self-assessment-generation'
    );
    const rawQuestions = extractJsonFromResponse(aiResponseString);

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      throw new Error("L'AI non ha generato domande valide.");
    }

    const db: Db = (await mongoClient()).db(DB_NAME);
    const materialsCollection = db.collection("materials");
    const materialObjectIds = materialIds.map((id: string) => new ObjectId(id));
    const accessibleMaterials = await materialsCollection
      .find({ _id: { $in: materialObjectIds } })
      .toArray();

    const selfAssessmentTestsCollection = db.collection("selfAssessmentTests");
    let testTitle = "Test di Autovalutazione";

    if (accessibleMaterials.length > 0) {
      // Usa il titolo del primo materiale (o combinali se sono pochi)
      if (accessibleMaterials.length === 1) {
        testTitle = `Test ${accessibleMaterials[0].title}`;
      } else if (accessibleMaterials.length <= 3) {
        // Se sono massimo 3 materiali, mostrali tutti
        testTitle = `Test ${accessibleMaterials
          .map((m: any) => m.title)
          .join(" + ")}`;
      } else {
        // Altrimenti usa il primo e indica quanti altri ce ne sono
        testTitle = `Test ${accessibleMaterials[0].title} (+${accessibleMaterials.length - 1
          })`;
      }
    }

    // Calcola il numero progressivo per questi materiali e questo studente
    const existingTestsCount =
      await selfAssessmentTestsCollection.countDocuments({
        studentId: user._id,
        sourceMaterialIds: { $all: materialObjectIds },
      });

    const progressiveNumber = existingTestsCount + 1;

    // Formatta la data
    const formattedDate = new Date().toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    testTitle = `${testTitle} ${progressiveNumber} - ${formattedDate}`;

    const newTestDocument = {
      studentId: user._id,
      sourceMaterialIds: materialObjectIds,
      title: testTitle,
      description: `Generato da: ${accessibleMaterials
        .map((m: any) => m.title)
        .join(", ")}`,

      questions: rawQuestions.map((q: any, index: number) => {
        let finalOptions: { text: string }[] = [];
        let finalCorrectAnswer: string = "";
        let finalQuestionType = "";

        const aiTypeRaw = String(q.tipo || "")
          .toLowerCase()
          .trim();

        // Converti opzioni in array di stringhe se necessario
        let aiOptions: string[] = [];
        if (Array.isArray(q.opzioni)) {
          aiOptions = q.opzioni
            .map((opt: any) => String(opt).trim())
            .filter((opt: string) => opt.length > 0);
        } else if (q.opzioni && typeof q.opzioni === "object") {
          // Se è un oggetto, prova a estrarre i valori
          aiOptions = Object.values(q.opzioni)
            .map((opt: any) => String(opt).trim())
            .filter((opt: string) => opt.length > 0);
        }

        const aiCorrectAnswer: string | number | boolean | undefined =
          q.risposta_corretta;

        // Determina il tipo di domanda basandoti sui questionTypes richiesti e sul contenuto
        if (
          requestedTypes.includes("true-false") ||
          requestedTypes.includes("vero-falso") ||
          ["vero-falso", "true-false", "vero/falso"].includes(aiTypeRaw)
        ) {
          // --- TRUE/FALSE ---
          finalQuestionType = "true-false";
          finalOptions = [{ text: "Vero" }, { text: "Falso" }];

          if (typeof aiCorrectAnswer === "boolean") {
            finalCorrectAnswer = aiCorrectAnswer ? "Vero" : "Falso";
          } else if (typeof aiCorrectAnswer === "number") {
            finalCorrectAnswer = aiCorrectAnswer === 0 ? "Vero" : "Falso";
          } else if (typeof aiCorrectAnswer === "string") {
            const txt = aiCorrectAnswer.toLowerCase().trim();
            finalCorrectAnswer =
              txt === "vero" || txt === "true" || txt === "0"
                ? "Vero"
                : "Falso";
          } else {
            finalCorrectAnswer = "Falso"; // fallback sicuro
          }
        } else if (
          requestedTypes.includes("multiple-choice") ||
          [
            "scelta_multipla",
            "multiple-choice",
            "multiple choice",
            "scelta-multipla",
          ].includes(aiTypeRaw) ||
          aiOptions.length >= 2
        ) {
          // --- MULTIPLE CHOICE ---
          finalQuestionType = "multiple-choice";

          // Se non ci sono opzioni ma è richiesto multiple-choice, crea opzioni di default
          if (aiOptions.length === 0) {
            console.warn(
              `Question ${index + 1
              }: No options found for multiple-choice, creating defaults`
            );
            finalOptions = [
              { text: "Opzione A" },
              { text: "Opzione B" },
              { text: "Opzione C" },
              { text: "Opzione D" },
            ];
            finalCorrectAnswer = "Opzione A"; // fallback
          } else {
            // Pulisci le opzioni rimuovendo prefissi come "A)", "B)", etc.
            const cleanedOptions: string[] = [
              ...new Set(
                aiOptions.map((opt: string) =>
                  String(opt)
                    .replace(/^[A-Z]\)\s*/, "")
                    .replace(/^[a-z]\)\s*/, "")
                    .replace(/^[0-9]\.\s*/, "")
                    .trim()
                )
              ),
            ].filter((opt: string) => opt.length > 0);

            finalOptions = cleanedOptions.map((opt) => ({ text: opt }));

            // Determina la risposta corretta
            if (
              typeof aiCorrectAnswer === "number" &&
              aiCorrectAnswer >= 0 &&
              aiCorrectAnswer < cleanedOptions.length
            ) {
              finalCorrectAnswer = cleanedOptions[aiCorrectAnswer];
            } else if (typeof aiCorrectAnswer === "string") {
              // Prova a trovare una corrispondenza esatta o simile
              const cleanAnswer = aiCorrectAnswer
                .replace(/^[A-Z]\)\s*/, "")
                .replace(/^[a-z]\)\s*/, "")
                .trim();
              const matched = cleanedOptions.find(
                (opt) => opt.toLowerCase() === cleanAnswer.toLowerCase()
              );
              if (matched) {
                finalCorrectAnswer = matched;
              } else {
                // Fallback alla prima opzione
                console.warn(
                  `Question ${index + 1
                  }: Could not match correct answer "${aiCorrectAnswer}", using first option`
                );
                finalCorrectAnswer = cleanedOptions[0] || "Opzione non trovata";
              }
            } else {
              // Fallback alla prima opzione
              finalCorrectAnswer = cleanedOptions[0] || "Opzione non trovata";
            }
          }
        } else {
          // --- OPEN ENDED ---
          finalQuestionType = "open-ended-short";
          finalOptions = [];
          if (typeof aiCorrectAnswer === "string") {
            finalCorrectAnswer = aiCorrectAnswer;
          } else {
            finalCorrectAnswer = "Risposta non disponibile";
          }
        }

        return {
          questionText: q.domanda || "Testo della domanda non trovato",
          questionType: finalQuestionType,
          options: finalOptions,
          correctAnswer: finalCorrectAnswer,
          explanation: q.spiegazione || "",
          points: 1,
          aiGenerated: true,
          _id: new ObjectId(),
        };
      }),

      createdAt: new Date(),
    };

    const testInsertResult = await selfAssessmentTestsCollection.insertOne(
      newTestDocument
    );
    const newTestId = testInsertResult.insertedId;

    const selfAssessmentSubmissionsCollection = db.collection(
      "selfAssessmentSubmissions"
    );
    const newSubmissionDocument = {
      testId: newTestId,
      studentId: user._id,
      status: "in-progress",
      startedAt: new Date(),
      answers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const submissionInsertResult =
      await selfAssessmentSubmissionsCollection.insertOne(
        newSubmissionDocument
      );
    const newSubmissionId = submissionInsertResult.insertedId;

    return res.status(201).json({
      message: "Test di autovalutazione generato e pronto per essere svolto!",
      submissionId: newSubmissionId.toString(),
    });
  } catch (error: any) {
    console.error("Error generating self-assessment test:", error);
    return res.status(500).json({
      message:
        "Errore del server durante la generazione del test di autovalutazione.",
    });
  }
};
