import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getDefaultDatabase } from "../../_helpers/getDatabase";
import { ObjectId } from "mongodb";
import { getGeminiClient } from "../../_helpers/AI/getClient";

const generateTestInsight = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const testId = request.pathParameters?.testId;

  if (!testId || !ObjectId.isValid(testId)) {
    throw createError.BadRequest("Invalid or missing testId");
  }

  const db = await getDefaultDatabase();
  const testObjectId = new ObjectId(testId);

  // 1. Get Test Info
  const test = await db.collection("tests").findOne({ _id: testObjectId });
  if (!test) {
    throw createError.NotFound("Test not trovato");
  }

  // 2. Get All Reviewed Attempts with student details and questions
  const attempts = await db.collection("attempts").aggregate([
    { $match: { testId: testObjectId, status: 'reviewed' } },
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "studentData"
      }
    },
    { $unwind: "$studentData" }
  ]).toArray();

  if (attempts.length === 0) {
    return { insight: "Non ci sono ancora abbastanza tentativi corretti per generare un'analisi della classe." };
  }

  // 3. Prepare aggregated data for AI
  const totalStudents = attempts.length;
  const avgScore = attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalStudents;
  const totalTime = attempts.reduce((acc, curr) => acc + (curr.timeSpent || 0), 0);
  const avgTime = totalTime / totalStudents;

  // Topic mastery aggregation
  const topicStats: Record<string, { total: number, correct: number }> = {};
  attempts.forEach(attempt => {
    attempt.questions?.forEach((q: any) => {
      const topic = q.question?.topic || "Generale";
      if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
      topicStats[topic].total++;
      if (q.status === 'correct' || (q.score && q.score > 0)) { // Simple heuristic for topic performance
         topicStats[topic].correct++;
      }
    });
  });

  const topicPerformance = Object.entries(topicStats).map(([name, stats]) => ({
    topic: name,
    percentage: Math.round((stats.correct / stats.total) * 100)
  }));

  const prompt = `Sei un esperto pedagogista. Analizza i risultati della classe per il test "${test.name}" per fornire un'analisi professionale al docente.
  
  Dati Aggregati:
  - Numero Studenti: ${totalStudents}
  - Punteggio Medio: ${avgScore.toFixed(1)} / ${test.maxScore}
  - Tempo Medio per Studente: ${Math.round(avgTime / 60)} minuti
  - Performance per Argomento: ${JSON.stringify(topicPerformance)}
  
  Linee Guida:
  1. Fornisci un'analisi professionale in terza persona (max 200 parole). Riferisciti alla classe come "La classe", "Gli studenti", ecc.
  2. Identifica eventuali "misconceptions" o argomenti in cui la classe ha avuto difficoltà.
  3. Suggerisci attività di recupero o approfondimento basate sui dati.
  4. Mantieni un tono incoraggiante e costruttivo.
  5. Rispondi in italiano.
  `;

  try {
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: "Genera l'analisi della classe." }] }],
      config: {
        systemInstruction: prompt,
        temperature: 0.7,
        maxOutputTokens: 600,
      },
    });

    return {
      insight: response.text || "Impossibile generare l'analisi al momento."
    };
  } catch (error) {
    console.error("Errore generazione test insight:", error);
    return { insight: "Errore durante la generazione dell'analisi IA della classe." };
  }
};

export const handler = lambdaRequest(generateTestInsight);
