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

    console.log("=== ORGANIZATIONS ===");
    const orgs = await db.collection("organizations").find({}).toArray();
    for (const org of orgs) {
        console.log(`- Org: ${org.name} (_id: ${org._id})`);
    }

    console.log("\n=== CLASSES ===");
    const classes = await db.collection("classes").find({}).toArray();
    for (const cls of classes) {
        console.log(`- Class: ${cls.name} (_id: ${cls._id}, orgId: ${cls.organizationId}, students count: ${cls.students?.length || 0})`);
    }

    console.log("\n=== SUBJECTS ===");
    const subjects = await db.collection("subjects").find({}).toArray();
    for (const sub of subjects) {
        console.log(`- Subject: ${sub.name} (_id: ${sub._id}, orgId: ${sub.organizationId})`);
    }

    console.log("\n=== USERS (Docenti/Studenti) ===");
    const users = await db.collection("users").find({}).toArray();
    console.log(`Total users in DB: ${users.length}`);
    for (const user of users) {
        if (user.role === 'teacher') {
            console.log(`- Teacher: ${user.firstName} ${user.lastName} (${user.username})`);
        }
    }

    await clientMongo.close();
};

start().catch(console.error);
