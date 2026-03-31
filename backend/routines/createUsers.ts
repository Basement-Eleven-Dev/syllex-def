import { config } from "dotenv";
import inquirer from "inquirer";
import { mongo } from "mongoose";
import { DB_NAME } from "../src/env";
import { createAndLinkUser } from "./createUser";

config();
process.env.AWS_PROFILE = "pathway";

const mongoConnectionString = process.env.DBCONNECTION as string;
const cognitoPoolId = "eu-south-1_w77iyt3xa";
const MASTER_ADMIN_EMAIL = "admin@syllex.com";

export interface Organization {
    _id?: mongo.ObjectId;
    name: string;
    administrators: mongo.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    courses?: string[];
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
    const classes = await db.collection("classes").find({ organizationId: new mongo.ObjectId(orgId as string) }).toArray()
    const { prefix, count, classId } =
        await inquirer.prompt([

            { name: "count", type: "number", message: "Quanti studenti?" },
            { name: "prefix", type: "input", message: "Prefisso email (le email saranno <prefisso>1@syllex.org, <prefisso>2@syllex.org,...):" },
            {
                name: "classId",
                type: "list",
                message: "A quale classe vuoi aggiungerli?",
                choices: classes.map(c => ({
                    name: c.name,
                    value: c._id.toString()
                })),
            },
        ]);
    let userIds: mongo.ObjectId[] = [];
    for (let i = 0; i < count; i++) {
        const host = prefix + (i + 1).toString()
        const email = host + '@syllex.org';
        const password = host;
        let creation = await createAndLinkUser(db, {
            email: email,
            password: password,
            firstName: 'Utente Esempio',
            lastName: (i + 1).toString(),
            role: 'student',
            organizationIds: [orgId]
        })
        userIds.push(creation._id)
    }
    //@ts-ignore
    await db.collection("classes").updateOne({ _id: new ObjectId(classId as string) }, { $push: { students: { $each: userIds } } })

    await clientMongo.close();
};

start()
    .catch(console.error)
    .then(() => process.exit(0));
