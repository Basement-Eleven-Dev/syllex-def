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

    const subjectId = new mongo.ObjectId("6a0b26c5aa8bb0244f4a1b72"); // Filosofia

    console.log("=== CHECKING ALL TESTS FOR FILOSOFIA ===");
    const tests = await db.collection("tests").find({ subjectId }).toArray();
    for (const test of tests) {
        console.log(`- Test Name: ${test.name} (_id: ${test._id}, questions count: ${test.questions?.length})`);
    }

    await clientMongo.close();
};

start().catch(console.error);
