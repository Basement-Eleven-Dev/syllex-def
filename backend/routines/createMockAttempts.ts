import { config } from "dotenv";
import inquirer from "inquirer";
import { mongo } from "mongoose";
import { DB_NAME } from "../src/env";
import { Test } from "../src/models/schemas/test.schema";
import { User } from "../src/models/schemas/user.schema";
import { Question } from "../src/models/schemas/question.schema";

config();
process.env.AWS_PROFILE = "pathway";

const mongoConnectionString = process.env.DBCONNECTION as string;

export interface Organization {
    _id?: mongo.ObjectId;
    name: string;
    administrators: mongo.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    courses?: string[];
}

const generateMockTest = async (attemptsColl: mongo.Collection, student: User, test: Test, questions: Question[]) => {

    const statuses = ['empty', 'wrong', 'correct'];
    let maxScore = 0;
    let score = 0;
    const objectToInsert = {
        mock: true,
        testId: test._id,
        subjectId: test.subjectId,
        teacherId: test.teacherId,
        studentId: student._id,
        status: 'reviewed',
        startedAt: new Date(),
        timeSpent: Math.ceil(Math.random() * 150),
        score: score,
        maxScore: maxScore,
        fitTestScore: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deliveredAt: new Date(),
        reviewedAt: new Date(),
        questions: questions.map(q => {
            const points: number = test.questions.find(el => el.questionId.toString() == q._id?.toString())?.points || 1;
            maxScore += points;
            const currentStatus: 'empty' | 'wrong' | 'correct' = statuses[Math.floor(Math.random() * 3)] as 'empty' | 'wrong' | 'correct'
            let answer = ""
            if (currentStatus == 'wrong') {
                answer = q.options?.find(opt => !opt.isCorrect)?.label || ""
            }
            if (currentStatus == 'correct') {
                answer = q.options?.find(opt => opt.isCorrect)?.label || ""
                score += points
            }
            return {
                question: q,
                score: currentStatus == 'correct' ? points : 0,
                points: points,
                status: currentStatus,
                answer: answer,
                teacherComment: ""
            }
        })
    }
    objectToInsert.score = score;
    objectToInsert.maxScore = maxScore;
    await attemptsColl.insertOne(objectToInsert)
}

/**
 * Funzione principale che orchestra il processo.
 */
const start = async () => {
    if (!mongoConnectionString)
        throw new Error("Stringa di connessione a Mongo non trovata.");

    const clientMongo = new mongo.MongoClient(mongoConnectionString);
    await clientMongo.connect();
    const db = clientMongo.db(DB_NAME);
    const orgsCollection = db.collection("organizations");

    // 1. Recupera e mostra le organizzazioni esistenti
    const allOrgs = await orgsCollection.find({}).toArray();
    if (allOrgs.length === 0) {
        console.error(
            "\n❌ ERRORE: Nessuna organizzazione trovata. Per favore, inizializzane una prima.",
        );
        await clientMongo.close();
        return;
    }
    const { orgId } = await inquirer.prompt([{
        name: "orgId",
        type: "list",
        message: "Seleziona l'Organizzazione a cui aggiungere studenti:",
        choices: allOrgs.map((org) => ({
            name: org.name,
            value: org._id.toString(),
        })),
    }])
    const subjects = await db.collection("subjects").find({ organizationId: new mongo.ObjectId(orgId as string) }).toArray();
    const { subjectId } = await inquirer.prompt([{
        name: "subjectId",
        type: "list",
        message: "Seleziona la materia per cui compilare tests casuali:",
        choices: subjects.map((sub) => ({
            name: sub.name,
            value: sub._id.toString(),
        })),
    }])
    const classes = await db.collection("classes").find({ organizationId: new mongo.ObjectId(orgId as string) }).toArray()
    const tests = await db.collection("tests").find({ subjectId: new mongo.ObjectId(subjectId as string) }).toArray();
    const { classObject, test } = await inquirer.prompt([
        {
            name: "classObject",
            type: "list",
            message: "Per quale classe vuoi crearli?",
            choices: classes.map(c => ({
                name: c.name,
                value: c
            })),
        },
        {
            name: "test",
            type: "list",
            message: "Seleziona il test per cui compilare tests casuali:",
            choices: tests.map((test, index) => ({
                name: (index + 1) + ') ' + test.name,
                value: test,
            })),
        }
    ])
    const questionIds = test.questions.map((el: any) => el.questionId);
    const questions = await db.collection("questions").find({ _id: { $in: questionIds } }).toArray();
    if (questions.some(el => el.type == 'risposta aperta')) throw Error('Le risposte aperte non sono supportate');
    const students = await db.collection("users").find({ _id: { $in: classObject.students } }).toArray();
    for (let i = 0; i < students.length; i++) await generateMockTest(db.collection("attempts"), students[i] as User, test, questions as Question[]);
    await clientMongo.close();
};

start()
    .catch(console.error)
    .then(() => process.exit(0));
