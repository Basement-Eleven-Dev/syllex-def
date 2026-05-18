import { config } from "dotenv";
import { mongo } from "mongoose";
import { DB_NAME } from "../src/env";

config();

const mongoConnectionString = process.env.DBCONNECTION as string;

const start = async () => {
    if (!mongoConnectionString) {
        console.error("DBCONNECTION not found in env!");
        return;
    }
    const clientMongo = new mongo.MongoClient(mongoConnectionString);
    await clientMongo.connect();
    const db = clientMongo.db(DB_NAME);

    const subjectId = new mongo.ObjectId("6a0b26c5aa8bb0244f4a1b72");
    console.log("=== TESTS FOR FILOSOFIA ===");
    const tests = await db.collection("tests").find({ subjectId }).toArray();
    for (const test of tests) {
        console.log(`- Test Name: ${test.name} (_id: ${test._id}, teacherId: ${test.teacherId}, questions count: ${test.questions?.length || 0})`);
    }

    console.log("\n=== STUDENTS OF CLASS 1C ===");
    const class1C = await db.collection("classes").findOne({ _id: new mongo.ObjectId("6a0b29830914babbec9c1e41") });
    if (class1C) {
        const students = await db.collection("users").find({ _id: { $in: class1C.students } }).toArray();
        for (const s of students) {
            console.log(`- Student: ${s.firstName} ${s.lastName} (${s.username})`);
            const attempts = await db.collection("attempts").find({ studentId: s._id }).toArray();
            console.log(`  -> Attempts: ${attempts.length}`);
            for (const att of attempts) {
                console.log(`     * Attempt for test: ${att.testId} (Score: ${att.score}/${att.maxScore}, Status: ${att.status})`);
            }
        }
    }

    await clientMongo.close();
};

start().catch(console.error);
