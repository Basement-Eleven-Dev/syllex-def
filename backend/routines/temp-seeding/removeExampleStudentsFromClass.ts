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

    const classId = new mongo.ObjectId("6a0b29830914babbec9c1e41"); // Class 1C

    // Find all users whose firstName is "Utente Esempio"
    const exampleUsers = await db.collection("users").find({ firstName: "Utente Esempio" }).toArray();
    const exampleUserIds = exampleUsers.map(u => u._id);

    console.log(`🔍 Found ${exampleUsers.length} users with name 'Utente Esempio'.`);

    if (exampleUserIds.length > 0) {
        // Remove these student IDs from the students array of Class 1C
        const updateResult = await db.collection("classes").updateOne(
            { _id: classId },
            { $pull: { students: { $in: exampleUserIds } } } as any
        );

        console.log(`🧹 Updated class 1C: removed 'Utente Esempio' students. Modified count: ${updateResult.modifiedCount}`);

        // Let's print the remaining students in the class
        const updatedClass = await db.collection("classes").findOne({ _id: classId });
        if (updatedClass && updatedClass.students) {
            const remainingStudents = await db.collection("users").find({ _id: { $in: updatedClass.students } }).toArray();
            console.log(`\n=== REMAINING STUDENTS IN CLASS 1C (${remainingStudents.length}) ===`);
            for (const s of remainingStudents) {
                console.log(`- ${s.firstName} ${s.lastName} (${s.username})`);
            }
        }
    } else {
        console.log("ℹ️ No 'Utente Esempio' users found to remove from class.");
    }

    await clientMongo.close();
};

start().catch(console.error);
