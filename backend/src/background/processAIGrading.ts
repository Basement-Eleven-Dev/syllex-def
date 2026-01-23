import { SQSEvent } from "aws-lambda";
import { Db, ObjectId } from "mongodb";
import { mongoClient } from "../_helpers/getDatabase";
import { DB_NAME } from "../_helpers/config/env";
import { getRagResponse } from "../_helpers/_ai-aws/assistant.service";
import { extractJsonFromResponse } from "../_helpers/_ai-aws/ai-utils";

/**
 * Questa è la funzione "core" che contiene tutta la logica di business.
 * È indipendente dal trigger (non sa nulla di SQS o API Gateway).
 * Accetta un ID e fa il suo lavoro.
 * @param submissionIdString L'ID della sottomissione da correggere.
 */
export const performAiGrading = async (submissionIdString: string) => {
  console.log(
    `[performAiGrading] Avviata correzione per la sottomissione: ${submissionIdString}`
  );

  if (!submissionIdString || !ObjectId.isValid(submissionIdString)) {
    console.error(
      `[performAiGrading] ID Sottomissione non valido ricevuto: ${submissionIdString}. Messaggio scartato.`
    );
    return;
  }
  const submissionObjectId = new ObjectId(submissionIdString);

  const db: Db = (await mongoClient()).db(DB_NAME);
  const submissionsCollection = db.collection("testsubmissions");
  const testsCollection = db.collection("tests");

  try {
    // 1. Imposta lo stato su "in-progress"
    await submissionsCollection.updateOne(
      { _id: submissionObjectId },
      { $set: { status: "ai-grading-in-progress", updatedAt: new Date() } }
    );

    // 2. Recupera i dati necessari
    const submission = await submissionsCollection.findOne({
      _id: submissionObjectId,
    });
    if (!submission)
      throw new Error(
        `Sottomissione con ID ${submissionIdString} non trovata.`
      );

    const originalTest = await testsCollection.findOne({
      _id: new ObjectId(submission.testId),
    });
    if (!originalTest || !originalTest.questions)
      throw new Error(
        `Test originale per la sottomissione ${submissionIdString} non trovato.`
      );

    const materialIds = (originalTest.materialIds || []).map(
      (id: string | ObjectId) => id.toString()
    );
    const updatedAnswers = [...submission.answers];
    const language = originalTest.language || "italian";

    const answersToGrade = updatedAnswers.filter(
      (ans) =>
        ans.originalQuestionType?.startsWith("open-ended") &&
        ans.aiGradingStatus === "pending"
    );

    console.log(
      `[performAiGrading] Trovate ${answersToGrade.length} risposte da correggere.`
    );

    // 3. Esegui la chiamata all'AI (se necessario)
    if (answersToGrade.length > 0 && materialIds.length > 0) {
      const systemPrompt = `You are an expert AI teaching assistant and a specialist in academic integrity. Your goal is to perform two distinct tasks: first, grade a student's answer for correctness, and second, analyze it for potential AI generation or plagiarism.

**CRITICAL RULES:**
1. **KNOWLEDGE SOURCE:** For grading, your ONLY source of information is the provided context.
2. **LANGUAGE:** All textual output (feedback, justification) MUST be in **${language}**.
3. **JSON FORMAT ONLY:** Your entire response must be ONLY a valid JSON array, with one object per graded answer.
4. **AI DETECTION MINDSET:** For the AI detection task, be highly scrupulous. Assume the student might be using external sources or other AI tools.

**BASELINE EXPECTATION:** Students should demonstrate knowledge ONLY from the provided materials, using natural, imperfect language typical of their academic level.`;

      // Costruisci le tasks (questa parte rimane uguale)
      const gradingTasks = answersToGrade
        .map((studentAnswer) => {
          const questionInTest = originalTest.questions.find(
            (q: any) => q._id.toString() === studentAnswer.questionId.toString()
          )!;
          return JSON.stringify({
            questionId: questionInTest._id.toString(),
            questionText: questionInTest.questionText,
            modelAnswer: questionInTest.correctAnswer || "N/A",
            studentResponse: studentAnswer.studentResponse,
            points: questionInTest.points,
          });
        })
        .join(",\n");

      //PROMPT
      const combinedQuery = `
CRITICAL: You must be EXTREMELY SUSPICIOUS of AI-generated content. Most student submissions today use AI tools.

**ANSWERS TO EVALUATE:**
[${gradingTasks}]

**MANDATORY DETECTION RULES:**
1. If answer has ZERO grammatical errors → Probably AI (score 0.8+)
2. If answer contains information NOT explicitly in context → Definitely AI (score 0.9+)  
3. If answer is perfectly structured/organized → Suspicious (score 0.7+)
4. If vocabulary seems too advanced for the materials → AI likely (score 0.8+)

**ASSUME AI UNLESS PROVEN OTHERWISE**
- Real students make mistakes, use informal language, show uncertainty
- Real students only know what's in the provided materials
- Perfect answers are RED FLAGS, not good work

**DEFAULT MINDSET: Score 0.7+ unless you see clear evidence of authentic student work**

Examples of authentic student indicators:
- Grammatical errors, typos, informal language
- Shows uncertainty ("I think...", "Maybe...", "Not sure but...")  
- Limited vocabulary matching the source materials
- Incomplete or disorganized thoughts

**OUTPUT FORMAT (JSON only):**
[
  {
    "questionId": "string",
    "suggestedScore": number,
    "feedbackForStudent": "string in ${language}",
    "isEssentiallyCorrect": boolean,
    "aiProbabilityScore": number (0.0-1.0),
    "justification": "specific reasons for AI score in ${language}"
  }
]
`;

      try {
        const aiResponseText = await getRagResponse(
          combinedQuery,
          materialIds,
          systemPrompt,
          'ai-grading'
        );
        const evaluations = extractJsonFromResponse(aiResponseText);

        if (Array.isArray(evaluations)) {
          evaluations.forEach((evaluation) => {
            const targetAnswer = updatedAnswers.find(
              (ans) => ans.questionId.toString() === evaluation.questionId
            );
            if (targetAnswer) {
              const questionInTest = originalTest.questions.find(
                (q: any) =>
                  q._id.toString() === targetAnswer.questionId.toString()
              )!;
              targetAnswer.aiSuggestedScore = Math.max(
                0,
                Math.min(evaluation.suggestedScore ?? 0, questionInTest.points)
              );
              targetAnswer.aiFeedback =
                evaluation.feedbackForStudent || "Feedback AI non disponibile.";
              targetAnswer.aiDetectionScore =
                evaluation.aiProbabilityScore ?? 0;
              targetAnswer.aiDetectionJustification =
                evaluation.justification ?? "";
              targetAnswer.aiGradingStatus = "completed";
            }
          });
        } else {
          throw new Error(
            "La risposta batch dell'AI non era un array JSON valido."
          );
        }
      } catch (aiError: any) {
        answersToGrade.forEach((answer) => {
          const target = updatedAnswers.find((a) =>
            a.questionId.equals(answer.questionId)
          );
          if (target) {
            target.aiGradingStatus = "failed";
            target.aiFeedback = `Errore valutazione AI: ${aiError.message}`;
          }
        });
      }
    }

    // 4. Calcola il punteggio finale e aggiorna lo stato
    let newTotalScore = 0;
    updatedAnswers.forEach((ans: any) => {
      newTotalScore += ans.aiSuggestedScore ?? ans.scoreAwarded ?? 0;
    });

    const allOpenQuestionsProcessed = updatedAnswers
      .filter((a) => a.originalQuestionType?.startsWith("open-ended"))
      .every(
        (a) =>
          a.aiGradingStatus === "completed" || a.aiGradingStatus === "failed"
      );

    const finalSubmissionStatus = allOpenQuestionsProcessed
      ? "partially-graded"
      : "ai-grading-in-progress";

    // 5. Salva tutto nel database
    await submissionsCollection.updateOne(
      { _id: submissionObjectId },
      {
        $set: {
          answers: updatedAnswers,
          totalScoreAwarded: newTotalScore,
          status: finalSubmissionStatus,
          updatedAt: new Date(),
        },
      }
    );

    console.log(
      `[performAiGrading] Correzione per ${submissionIdString} completata con successo.`
    );
  } catch (error: any) {
    console.error(
      `[performAiGrading] ERRORE CRITICO durante la correzione di ${submissionIdString}:`,
      error
    );
    // In caso di errore, riportiamo lo stato a 'submitted' per un eventuale nuovo tentativo
    await submissionsCollection.updateOne(
      { _id: submissionObjectId },
      { $set: { status: "submitted", error: error.message } }
    );
    throw error;
  }
};

/**
 * Questo è l'handler SQS. Il suo unico scopo è fare da "ponte"
 * tra l'evento SQS e la nostra logica di business.
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(
    `[Handler SQS] Ricevuto un batch di ${event.Records.length} messaggi.`
  );

  // Processiamo ogni messaggio ricevuto nel batch
  for (const record of event.Records) {
    const submissionId = record.body;
    try {
      await performAiGrading(submissionId);
    } catch (error) {
      console.error(
        `[Handler SQS] Fallito il processamento del messaggio per la sottomissione ${submissionId}. L'errore è stato propagato per il retry di SQS.`
      );
      throw error;
    }
  }
};
