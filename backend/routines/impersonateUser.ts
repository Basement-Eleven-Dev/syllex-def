import { config } from "dotenv";
import { mongo } from "mongoose";
import { DB_NAME } from "../src/env";
import { execSync } from "child_process";

config();
process.env.AWS_PROFILE = "pathway";

const mongoConnectionString = process.env.DBCONNECTION as string;
const FRONTEND_URL = "http://localhost:4200";

const main = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx ts-node routines/impersonateUser.ts <email>");
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

  const userId = user._id.toString();
  const userName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || email;

  console.log(`\n👤 Utente trovato:`);
  console.log(`   Nome:  ${userName}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Ruolo: ${user.role}`);
  console.log(`   ID:    ${userId}\n`);

  const jsCommand = `localStorage.setItem('impersonatedUserId','${userId}');localStorage.setItem('impersonatedUserName','${userName}');window.location.href='/';`;

  // Tenta automazione via AppleScript su Chrome (macOS)
  const automate = process.argv.includes("--auto");
  if (automate) {
    try {
      const escapedJs = jsCommand.replace(/'/g, "\\'").replace(/"/g, '\\"');
      const appleScript = `tell application "Google Chrome"
  set targetTab to null
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t starts with "${FRONTEND_URL}" then
        set targetTab to t
        set active tab index of w to (index of t)
        set index of w to 1
        exit repeat
      end if
    end repeat
    if targetTab is not null then exit repeat
  end repeat
  if targetTab is null then
    tell front window to set targetTab to make new tab with properties {URL:"${FRONTEND_URL}"}
    delay 2
  end if
  tell targetTab to execute javascript "${escapedJs}"
end tell`;
      execSync(`osascript -e '${appleScript.replace(/'/g, "'\\''")}'`, {
        stdio: "pipe",
      });
      console.log("✅ Impersonation applicata in Chrome!");
      console.log(`   Ora stai navigando come: ${userName}\n`);
      console.log(
        "   Per uscire dall'impersonation, esegui nella console del browser:",
      );
      console.log(
        "   localStorage.removeItem('impersonatedUserId');localStorage.removeItem('impersonatedUserName');window.location.href='/a';",
      );
    } catch (err: any) {
      console.warn("⚠️  Automazione Chrome fallita. Assicurati che:");
      console.warn("   1. Chrome sia aperto con localhost:4200");
      console.warn(
        '   2. "Allow JavaScript from Apple Events" sia attivo (View > Developer)\n',
      );
      printManualInstructions(jsCommand);
    }
  } else {
    printManualInstructions(jsCommand);
  }

  await client.close();
};

const printManualInstructions = (jsCommand: string) => {
  console.log(
    "📋 Copia e incolla nella console del browser (devi essere loggato come admin):\n",
  );
  console.log(jsCommand);
  console.log(
    "\n💡 Usa --auto per tentare l'automazione diretta su Chrome (macOS).",
  );
  console.log(
    "   Esempio: npx ts-node routines/impersonateUser.ts user@email.com --auto\n",
  );
  console.log("🔙 Per uscire dall'impersonation:");
  console.log(
    "   localStorage.removeItem('impersonatedUserId');localStorage.removeItem('impersonatedUserName');window.location.href='/a';",
  );
};

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
