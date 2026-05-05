import { config } from "dotenv";
import { mongo } from "mongoose";
import { DB_NAME } from "../src/env";

config();
process.env.AWS_PROFILE = "pathway";

const mongoConnectionString = process.env.DB_CONNECTION as string;

const main = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run impersonate <email>");
    process.exit(1);
  }

  if (!mongoConnectionString) {
    console.error("DBCONNECTION env variable not set. Check your .env file.");
    process.exit(1);
  }

  const client = new mongo.MongoClient(mongoConnectionString);
  await client.connect();
  const db = client.db(DB_NAME);

  const user = await db.collection("users").findOne({
    email: {
      $regex: new RegExp(
        `^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    },
  });

  if (!user) {
    console.error(`\n❌ Utente non trovato: ${email}`);
    await client.close();
    process.exit(1);
  }

  const userName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || email;

  console.log(`\n👤 Utente trovato:`);
  console.log(`   Nome:  ${userName}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Ruolo: ${user.role}`);
  console.log(`   Org:   ${user.organizationId || "nessuna"}\n`);

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔑 Come usare l'impersonation:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`1. Fai login come ADMIN (super-admin senza organizzazione)`);
  console.log(
    `2. Installa l'estensione Chrome "ModHeader" o usa la console DevTools`,
  );
  console.log(`3. Aggiungi l'header:\n`);
  console.log(`   X-Impersonate-User: ${user.email}\n`);
  console.log(`4. Ricarica la pagina. Ora navighi come ${userName}.\n`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔙 Per smettere: rimuovi l'header e ricarica.`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  await client.close();
};

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
