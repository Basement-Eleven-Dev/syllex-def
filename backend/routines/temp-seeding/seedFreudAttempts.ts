import { config } from "dotenv";
import { mongo } from "mongoose";
import { DB_NAME } from "../src/env";

config();
process.env.AWS_PROFILE = "pathway";

const mongoConnectionString = process.env.DBCONNECTION as string;

const generateMockTestForStudent = async (
  attemptsColl: mongo.Collection,
  student: any,
  test: any,
  questions: any[],
  daysAgo: number
) => {
  const statuses = ['empty', 'wrong', 'correct'];
  let maxScore = 0;
  let score = 0;

  // Spaced out baseDate
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - daysAgo);
  baseDate.setHours(Math.floor(Math.random() * 6) + 9); // between 9:00 and 15:00
  baseDate.setMinutes(Math.floor(Math.random() * 60));

  const questionsAttempt = questions.map((q) => {
    const points: number = test.questions.find((el: any) => el.questionId.toString() == q._id?.toString())?.points || 1;
    maxScore += points;

    // Distribute status (skewed towards correct/wrong)
    const rand = Math.random();
    const currentStatus: 'empty' | 'wrong' | 'correct' = 
      rand < 0.1 ? 'empty' : (rand < 0.35 ? 'wrong' : 'correct');

    let answer = "";
    if (currentStatus === 'wrong') {
      answer = q.options?.find((opt: any) => !opt.isCorrect)?.label || "Risposta errata";
    }
    if (currentStatus === 'correct') {
      answer = q.options?.find((opt: any) => opt.isCorrect)?.label || "Risposta corretta";
      score += points;
    }

    return {
      question: q,
      score: currentStatus === 'correct' ? points : 0,
      points: points,
      status: currentStatus,
      answer: answer,
      teacherComment: ""
    };
  });

  const objectToInsert = {
    mock: true,
    testId: test._id,
    subjectId: test.subjectId,
    teacherId: test.teacherId,
    studentId: student._id,
    status: 'reviewed',
    startedAt: new Date(baseDate.getTime() - 20 * 60 * 1000), // 20 mins before delivery
    timeSpent: Math.ceil(Math.random() * 100) + 400, // 400-500 seconds
    score: score,
    maxScore: maxScore,
    fitTestScore: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    deliveredAt: baseDate,
    reviewedAt: new Date(baseDate.getTime() + 8 * 60 * 1000), // reviewed 8 mins later
    questions: questionsAttempt
  };

  await attemptsColl.insertOne(objectToInsert);
  console.log(`✅ Freud Attempt created for ${student.firstName} ${student.lastName} (Score: ${score}/${maxScore}, Date: ${baseDate.toLocaleDateString()})`);
};

const start = async () => {
  if (!mongoConnectionString) {
    throw new Error("DBCONNECTION not found.");
  }

  const clientMongo = new mongo.MongoClient(mongoConnectionString);
  await clientMongo.connect();
  const db = clientMongo.db(DB_NAME);

  const classId = new mongo.ObjectId("6a0b29830914babbec9c1e41"); // Class 1C
  const testId = new mongo.ObjectId("6a0b39b87539d584dc1f3752"); // Verifica Sigmund Freud

  // 1. Get test and questions
  const test = await db.collection("tests").findOne({ _id: testId });
  if (!test) throw new Error("Test 'Verifica Sigmund Freud' not found!");

  const questionIds = test.questions.map((el: any) => el.questionId);
  const questions = await db.collection("questions").find({ _id: { $in: questionIds } }).toArray();

  console.log(`🔍 Test: ${test.name} has ${questions.length} questions.`);

  // 2. Get students of Class 1C
  const classDoc = await db.collection("classes").findOne({ _id: classId });
  if (!classDoc) throw new Error("Class 1C not found!");

  const students = await db.collection("users").find({ _id: { $in: classDoc.students } }).toArray();

  // Filter out Riccardo Santilli (email: riccardo@convivostudio.it)
  const targetStudents = students.filter(s => s.username !== "riccardo@convivostudio.it");

  console.log(`📝 Seeding Freud attempts for ${targetStudents.length} students (excluding Riccardo Santilli)...`);

  // Clear existing attempts for Freud test for these students first to avoid duplicates
  const targetStudentIds = targetStudents.map(s => s._id);
  const deleteResult = await db.collection("attempts").deleteMany({
    testId: testId,
    studentId: { $in: targetStudentIds }
  });
  if (deleteResult.deletedCount > 0) {
    console.log(`🧹 Cleaned up ${deleteResult.deletedCount} existing Freud attempts.`);
  }

  // Generate new attempts
  for (let i = 0; i < targetStudents.length; i++) {
    const student = targetStudents[i];
    // Spread attempts over the last 3 days (1 to 3 days ago)
    const daysAgo = Math.floor(Math.random() * 3) + 1;
    await generateMockTestForStudent(db.collection("attempts"), student, test, questions, daysAgo);
  }

  console.log("\n🎉 Sigmund Freud assessment seeding completed successfully!");
  await clientMongo.close();
};

start().catch(console.error).then(() => process.exit(0));
