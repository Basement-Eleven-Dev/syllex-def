import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { getGeminiClient } from "../../_helpers/AI/getClient";

const generateAttemptInsight = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const attemptId = request.pathParameters?.attemptId;

  if (!attemptId || !ObjectId.isValid(attemptId)) {
    throw createError.BadRequest("Invalid or missing attemptId");
  }

  const db = await getDefaultDatabase();
  const attemptObjectId = new ObjectId(attemptId);

  // 1. Get Attempt Info with Test and Student Details
  const result = await db.collection("attempts").aggregate([
    { $match: { _id: attemptObjectId } },
    {
      $lookup: {
        from: "tests",
        localField: "testId",
        foreignField: "_id",
        as: "testInfo"
      }
    },
    { $unwind: "$testInfo" },
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo"
      }
    },
    { $unwind: "$studentInfo" }
  ]).toArray();

  const attempt = result[0];
  if (!attempt) {
    throw createError.NotFound("Tentativo non trovato");
  }

  // 2. Get Class Averages for context
  const classStats = await db.collection("attempts").aggregate([
    { $match: { testId: attempt.testId, status: 'reviewed' } },
    {
      $group: {
        _id: "$testId",
        avgScore: { $avg: "$score" },
        avgTime: { $avg: "$timeSpent" }
      }
    }
  ]).toArray();

  const averages = classStats[0] || { avgScore: attempt.score, avgTime: attempt.timeSpent };

  // 3. Prepare data for AI
  const studentData = {
    name: attempt.studentInfo.firstName,
    score: attempt.score,
    maxScore: attempt.testInfo.maxScore,
    timeSpent: attempt.timeSpent,
    questions: attempt.questions.map((q: any) => ({
      topic: q.question?.topic || "Generale",
      isCorrect: q.status === 'correct' || (q.score && q.score > 0),
      studentAnswer: q.answer
    }))
  };

  const classContext = {
    avgScore: averages.avgScore,
    avgTime: averages.avgTime
  };

  const prompt = `Sei un esperto pedagogista. Analizza la performance dello studente ${studentData.name} in questo specifico test per fornire un feedback al docente.
  
  Risultati Studente:
  - Punteggio: ${studentData.score} / ${studentData.maxScore}
  - Tempo Impiegato: ${Math.round(studentData.timeSpent / 60)} minuti
  
  Contesto Classe (Medie):
  - Punteggio Medio: ${classContext.avgScore.toFixed(1)}
  - Tempo Medio: ${Math.round(classContext.avgTime / 60)} minuti

  Dettaglio Domande/Argomenti:
  ${JSON.stringify(studentData.questions)}

  Linee Guida:
  1. Produci un'analisi formativa rivolta al docente (max 150 parole).
  2. Usa SEMPRE la terza persona per riferirti allo studente (es. "Lo studente ha mostrato...", "${studentData.name} sembra aver difficoltà con..."). NON usare mai la seconda persona ("Hai fatto...").
  3. Focalizzati su cosa lo studente ha appreso bene e dove ha avuto difficoltà.
  4. Commenta la velocità di esecuzione rispetto alla classe e alla qualità delle risposte.
  5. Usa toni costruttivi e professionali.
  6. Rispondi in italiano.
  `;

  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: "Genera l'analisi individuale del tentativo." }] }],
      config: {
        systemInstruction: prompt,
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const insightContent = response.text || "Impossibile generare l'analisi individuale al momento.";

    // 4. Save insight to DB
    if (response.text) {
      await db.collection("attempts").updateOne(
        { _id: attemptObjectId },
        { $set: { aiInsight: response.text, updatedAt: new Date() } }
      );
    }

    return {
      insight: insightContent
    };
  } catch (error) {
    console.error("Errore generazione attempt insight:", error);
    return { insight: "Errore durante la generazione dell'analisi IA del compito." };
  }
};

export const handler = lambdaRequest(generateAttemptInsight);
