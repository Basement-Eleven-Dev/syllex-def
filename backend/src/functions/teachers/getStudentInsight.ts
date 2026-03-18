import { APIGatewayProxyEvent, Context } from "aws-lambda";
import createError from "http-errors";
import { lambdaRequest } from "../../_helpers/lambdaProxyResponse";
import { getGeminiClient } from "../../_helpers/AI/getClient";
import { User } from "../../models/schemas/user.schema";
import { Attempt } from "../../models/schemas/attempt.schema";
import { connectDatabase } from "../../_helpers/getDatabase";
import { mongo } from 'mongoose'
const generateStudentInsight = async (
  request: APIGatewayProxyEvent,
  context: Context,
) => {
  const studentId = request.pathParameters?.studentId;
  const subjectId = context.subjectId!;

  if (!studentId || !mongo.ObjectId.isValid(studentId)) {
    throw createError.BadRequest("Invalid or missing studentId");
  }

  await connectDatabase();
  const studentObjectId = new mongo.ObjectId(studentId);

  // 1. Get Student Info
  const student = await User.findOne({ _id: studentObjectId });
  if (!student) {
    throw createError.NotFound("Student not found");
  }

  // 3. Get Student Attempts with Test Names
  const attempts = await Attempt
    .aggregate([
      {
        $match: {
          subjectId: subjectId,
          studentId: studentObjectId,
          status: "reviewed",
          source: { $ne: "self-evaluation" }
        }
      },
      {
        $lookup: {
          from: "tests",
          localField: "testId",
          foreignField: "_id",
          as: "testData",
        },
      },
      { $unwind: "$testData" },
      { $sort: { deliveredAt: -1 } },
      { $limit: 15 },
    ])

  if (attempts.length === 0) {
    return {
      insight:
        "Non ci sono ancora abbastanza dati per generare un riassunto delle performance.",
    };
  }

  // 4. Prepare data for AI
  const performanceData = attempts.map((a) => ({
    testName: a.testData.name,
    score: a.score,
    maxScore: a.maxScore,
    percentage: a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0,
    date: a.deliveredAt || a.createdAt,
  }));

  const prompt = `Analizza le performance accademiche dello studente ${student.firstName} ${student.lastName} basandoti sui seguenti risultati dei test. 
  Fornisci un riassunto breve (max 150 parole), professionale e motivazionale che un docente possa leggere per capire i punti di forza dello studente e le aree di miglioramento.
  Rispondi in italiano.
  
  Risultati:
  ${JSON.stringify(performanceData, null, 2)}
  `;

  // 5. Call AI using same pattern as generateResponse
  try {
    const ai = await getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Using flash as it is stable and fast for summaries
      contents: [
        {
          role: "user",
          parts: [{ text: "Genera l'analisi basandoti sui dati forniti." }],
        },
      ],
      config: {
        systemInstruction: prompt,
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    return {
      insight: response.text || "Impossibile generare il riassunto al momento.",
    };
  } catch (error) {
    console.error("Errore generazione insight:", error);
    return { insight: "Errore durante la generazione dell'analisi IA." };
  }
};

export const handler = lambdaRequest(generateStudentInsight);
