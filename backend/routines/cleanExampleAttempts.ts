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

    const subjectId = new mongo.ObjectId("6a0b26c5aa8bb0244f4a1b72"); // Filosofia

    // Find all users whose firstName is "Utente Esempio"
    const exampleUsers = await db.collection("users").find({ firstName: "Utente Esempio" }).toArray();
    const exampleUserIds = exampleUsers.map(u => u._id);

    console.log(`🔍 Found ${exampleUsers.length} users with name 'Utente Esempio'.`);

    if (exampleUserIds.length > 0) {
        // Delete attempts for these users for the subject Filosofia
        const deleteResult = await db.collection("attempts").deleteMany({
            subjectId: subjectId,
            studentId: { $in: exampleUserIds }
        });
        console.log(`🧹 Deleted ${deleteResult.deletedCount} attempts for 'Utente Esempio' students for the subject Filosofia.`);
    } else {
        console.log("ℹ️ No 'Utente Esempio' users found in DB.");
    }

    await clientMongo.close();
};

start().catch(console.error);
