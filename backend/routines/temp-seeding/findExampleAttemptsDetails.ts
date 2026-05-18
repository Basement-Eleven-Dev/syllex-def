import { config } from "dotenv";
import { mongo } from "mongoose";
import { DB_NAME } from "../src/env";

config();

const mongoConnectionString = process.env.DBCONNECTION as string;

const start = async () => {
    if (!mongoConnectionString) {
        console.error("DBCONNECTION not found!");
        return;
    }
    const clientMongo = new mongo.MongoClient(mongoConnectionString);
    await clientMongo.connect();
    const db = clientMongo.db(DB_NAME);

    // 1. Get all students of Class 1C
    const classDoc = await db.collection("classes").findOne({ _id: new mongo.ObjectId("6a0b29830914babbec9c1e41") });
    if (!classDoc) {
        console.log("Class not found!");
        await clientMongo.close();
        return;
    }

    const students = await db.collection("users").find({ _id: { $in: classDoc.students } }).toArray();
    console.log(`=== DIAGNOSING CLASS 1C STUDENTS (${students.length}) ===`);

    for (const s of students) {
        const attempts = await db.collection("attempts").find({ studentId: s._id }).toArray();
        if (attempts.length > 0) {
            console.log(`Student: ${s.firstName} ${s.lastName} (Username: ${s.username}, Role: ${s.role}, DB ID: ${s._id})`);
            console.log(`  -> ${attempts.length} attempts found:`);
            for (const a of attempts) {
                const sub = await db.collection("subjects").findOne({ _id: a.subjectId });
                const t = await db.collection("tests").findOne({ _id: a.testId });
                console.log(`     * Attempt ID: ${a._id}`);
                console.log(`       Subject: ${sub?.name || 'Unknown'} (ID: ${a.subjectId})`);
                console.log(`       Test: ${t?.name || 'Unknown'} (ID: ${a.testId})`);
                console.log(`       Score: ${a.score}/${a.maxScore}`);
            }
        }
    }

    await clientMongo.close();
};

start().catch(console.error);
