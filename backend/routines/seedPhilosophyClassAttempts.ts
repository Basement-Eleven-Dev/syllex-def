import { config } from "dotenv";
import { mongo } from "mongoose";
import { DB_NAME } from "../src/env";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  AdminSetUserPasswordCommandInput,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

config();
process.env.AWS_PROFILE = "pathway";

const mongoConnectionString = process.env.DBCONNECTION as string;
const cognitoPoolId = "eu-south-1_w77iyt3xa";

const realisticStudents = [
  { firstName: "Sofia", lastName: "Rossi", email: "sofia.rossi@syllex.org" },
  { firstName: "Matteo", lastName: "Bianchi", email: "matteo.bianchi@syllex.org" },
  { firstName: "Emma", lastName: "Verdi", email: "emma.verdi@syllex.org" },
  { firstName: "Lorenzo", lastName: "Russo", email: "lorenzo.russo@syllex.org" },
  { firstName: "Giulia", lastName: "Gallo", email: "giulia.gallo@syllex.org" },
  { firstName: "Alessandro", lastName: "Esposito", email: "alessandro.esposito@syllex.org" },
  { firstName: "Chiara", lastName: "Ferrari", email: "chiara.ferrari@syllex.org" },
  { firstName: "Tommaso", lastName: "Romano", email: "tommaso.romano@syllex.org" },
  { firstName: "Alice", lastName: "Colombo", email: "alice.colombo@syllex.org" },
  { firstName: "Gabriele", lastName: "Ricci", email: "gabriele.ricci@syllex.org" },
  { firstName: "Sara", lastName: "Marini", email: "sara.marini@syllex.org" },
  { firstName: "Leonardo", lastName: "Leone", email: "leonardo.leone@syllex.org" }
];

const createOrGetCognitoUser = async (
  cognitoClient: CognitoIdentityProviderClient,
  email: string,
  firstName: string,
  lastName: string
): Promise<string> => {
  const username = email.trim();
  try {
    const createUserInput: AdminCreateUserCommandInput = {
      UserPoolId: cognitoPoolId,
      Username: username,
      MessageAction: "SUPPRESS",
      UserAttributes: [
        { Name: "email", Value: username },
        { Name: "email_verified", Value: "true" },
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
    };

    const createUserResult = await cognitoClient.send(
      new AdminCreateUserCommand(createUserInput)
    );

    // Set permanent password (email prefix or 'Philosophy1c!')
    const password = username.split('@')[0] + '1C!';
    const setPasswordInput: AdminSetUserPasswordCommandInput = {
      UserPoolId: cognitoPoolId,
      Username: username,
      Password: password,
      Permanent: true,
    };
    await cognitoClient.send(new AdminSetUserPasswordCommand(setPasswordInput));

    // Add to students group
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: cognitoPoolId,
      Username: username,
      GroupName: "students",
    });
    await cognitoClient.send(addToGroupCommand);

    const sub = createUserResult.User?.Attributes?.find(
      (attr) => attr.Name === "sub"
    )?.Value;

    if (!sub) throw new Error("Sub not found");
    return sub;
  } catch (error: any) {
    if (error.name === "UsernameExistsException") {
      // User already exists in Cognito, try to get existing details or return mock sub if already linked
      console.log(`ℹ️ User ${email} already exists in Cognito.`);
      return "existing_cognito_sub_" + Math.random().toString(36).substring(7);
    }
    throw error;
  }
};

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

  // Let's create a date centered around "daysAgo"
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - daysAgo);
  // Add some random hours/minutes so they aren't all at the exact same second
  baseDate.setHours(Math.floor(Math.random() * 8) + 8); // school hours: 8:00 - 16:00
  baseDate.setMinutes(Math.floor(Math.random() * 60));

  const questionsAttempt = questions.map((q) => {
    const points: number = test.questions.find((el: any) => el.questionId.toString() == q._id?.toString())?.points || 1;
    maxScore += points;

    // Distribute status (students do well usually, let's skew towards correct/wrong and less empty)
    const rand = Math.random();
    const currentStatus: 'empty' | 'wrong' | 'correct' = 
      rand < 0.15 ? 'empty' : (rand < 0.40 ? 'wrong' : 'correct');

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
    startedAt: new Date(baseDate.getTime() - 25 * 60 * 1000), // 25 mins before delivery
    timeSpent: Math.ceil(Math.random() * 100) + 500, // 500-600 seconds
    score: score,
    maxScore: maxScore,
    fitTestScore: null,
    createdAt: baseDate,
    updatedAt: baseDate,
    deliveredAt: baseDate,
    reviewedAt: new Date(baseDate.getTime() + 10 * 60 * 1000), // reviewed 10 mins later
    questions: questionsAttempt
  };

  await attemptsColl.insertOne(objectToInsert);
  console.log(`✅ Created attempt for ${student.firstName} ${student.lastName} (Score: ${score}/${maxScore}, Date: ${baseDate.toLocaleDateString()})`);
};

const start = async () => {
  if (!mongoConnectionString) {
    throw new Error("DBCONNECTION not found.");
  }

  const clientMongo = new mongo.MongoClient(mongoConnectionString);
  await clientMongo.connect();
  const db = clientMongo.db(DB_NAME);

  const orgId = new mongo.ObjectId("69a96c510d7cc3279a191ac0"); // Marina Militare 1234567
  const subjectId = new mongo.ObjectId("6a0b26c5aa8bb0244f4a1b72"); // Filosofia
  const classId = new mongo.ObjectId("6a0b29830914babbec9c1e41"); // 1C
  const testId = new mongo.ObjectId("6a0b3185b34cd0adfc842d28"); // Verifica di comprensione

  // 1. Get test and questions
  const test = await db.collection("tests").findOne({ _id: testId });
  if (!test) throw new Error("Test not found");

  const questionIds = test.questions.map((el: any) => el.questionId);
  const questions = await db.collection("questions").find({ _id: { $in: questionIds } }).toArray();

  const cognitoClient = new CognitoIdentityProviderClient({ region: "eu-south-1" });

  console.log("🚀 Seeding realistic students into Class 1C...");
  const newStudentIds: mongo.ObjectId[] = [];

  for (const s of realisticStudents) {
    // Check if user already exists in DB
    let userDoc = await db.collection("users").findOne({ username: s.email });
    if (!userDoc) {
      const sub = await createOrGetCognitoUser(cognitoClient, s.email, s.firstName, s.lastName);
      const insertResult = await db.collection("users").insertOne({
        username: s.email,
        cognitoId: sub,
        firstName: s.firstName,
        lastName: s.lastName,
        role: "student",
        organizationIds: [orgId],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      userDoc = { _id: insertResult.insertedId, ...s };
      console.log(`👤 Created DB user for ${s.firstName} ${s.lastName} (${s.email})`);
    } else {
      console.log(`👤 DB user ${s.firstName} ${s.lastName} already exists.`);
    }
    newStudentIds.push(userDoc._id);
  }

  // Add new students to class 1C if not already present
  const classDoc = await db.collection("classes").findOne({ _id: classId });
  if (!classDoc) throw new Error("Class 1C not found");

  const existingStudentIds = (classDoc.students || []).map((id: any) => id.toString());
  const studentsToPush = newStudentIds.filter(id => !existingStudentIds.includes(id.toString()));

  if (studentsToPush.length > 0) {
    await db.collection("classes").updateOne(
      { _id: classId },
      { $push: { students: { $each: studentsToPush } } } as any
    );
    console.log(`🔗 Linked ${studentsToPush.length} new students to Class 1C.`);
  }

  // Get ALL students of Class 1C (both existing and new)
  const updatedClassDoc = await db.collection("classes").findOne({ _id: classId });
  const allStudentsInClass = await db.collection("users").find({ _id: { $in: updatedClassDoc?.students || [] } }).toArray();

  console.log(`\n📝 Generating mock attempts for ${allStudentsInClass.length} students...`);

  // We want to generate attempts spread over the last 10 days to make the analytics look amazing!
  for (let i = 0; i < allStudentsInClass.length; i++) {
    const student = allStudentsInClass[i];
    
    // Skip students who already have attempts to avoid duplicate seeding (except if they are example users)
    const existingAttempts = await db.collection("attempts").countDocuments({ studentId: student._id, testId });
    if (existingAttempts > 0 && student.username === "riccardo@convivostudio.it") {
      console.log(`⏭️ Skipping ${student.firstName} ${student.lastName} (already has attempts).`);
      continue;
    }

    // Spread attempts over the last 10 days
    const daysAgo = Math.floor(Math.random() * 8) + 1; // 1 to 8 days ago
    await generateMockTestForStudent(db.collection("attempts"), student, test, questions, daysAgo);
  }

  console.log("\n🎉 Seeding completed successfully!");
  await clientMongo.close();
};

start().catch(console.error).then(() => process.exit(0));
