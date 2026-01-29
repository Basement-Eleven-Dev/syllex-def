import { config } from "dotenv";
import inquirer from "inquirer";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  AdminSetUserPasswordCommandInput,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { Db, MongoClient, ObjectId } from "mongodb";
import { DB_NAME } from "../src/_helpers/config/env";

config();
process.env.AWS_PROFILE = "pathway";

const mongoConnectionString = process.env.DBCONNECTION as string;
const cognitoPoolId = "eu-south-1_xuHdZQr2t";
const MASTER_ADMIN_EMAIL = "admin@syllex.com";

export interface Organization {
  _id?: ObjectId;
  name: string;
  administrators: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  courses?: string[];
}

export const createAndLinkUser = async (
  db: Db,
  userData: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: "admin" | "teacher" | "student";
    organizationIds: ObjectId[]; // Ora è un array
  }
) => {
  const { email, password, firstName, lastName, role, organizationIds } =
    userData;
  const client = new CognitoIdentityProviderClient({ region: "eu-south-1" });

  const createUserInput: AdminCreateUserCommandInput = {
    UserPoolId: cognitoPoolId,
    Username: email.trim(),
    MessageAction: "SUPPRESS",
    UserAttributes: [
      { Name: "email", Value: email.trim() },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: firstName },
      { Name: "family_name", Value: lastName },
    ],
  };
  if (password) {
    createUserInput.TemporaryPassword = password;
  }

  const createUserResult = await client.send(
    new AdminCreateUserCommand(createUserInput)
  );
  const addToGroupCommand = new AdminAddUserToGroupCommand({
    UserPoolId: cognitoPoolId,
    Username: email.trim(),
    GroupName: role == 'teacher' ? 'teachers' : 'students',
  });

  await client.send(addToGroupCommand);
  const cognitoSub = createUserResult.User?.Attributes?.find(
    (attr) => attr.Name === "sub"
  )?.Value;
  if (!cognitoSub)
    throw new Error("Creazione utente Cognito fallita: 'sub' non trovato.");

  if (password) {
    const setPasswordInput: AdminSetUserPasswordCommandInput = {
      UserPoolId: cognitoPoolId,
      Username: email.trim(),
      Password: password.trim(),
      Permanent: true,
    };
    await client.send(new AdminSetUserPasswordCommand(setPasswordInput));
  }

  const newUserDocument: any = {
    username: email.trim(),
    cognitoId: cognitoSub,
    firstName,
    lastName,
    role,
    organizationIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const usersCollection = db.collection("users");
  const result = await usersCollection.insertOne(newUserDocument);

  return { ...newUserDocument, _id: result.insertedId };
};

/**
 * Funzione principale che orchestra il processo.
 */
const start = async () => {
  if (!mongoConnectionString)
    throw new Error("Stringa di connessione a Mongo non trovata.");

  const clientMongo = new MongoClient(mongoConnectionString);
  await clientMongo.connect();
  const db = clientMongo.db(DB_NAME);
  const usersCollection = db.collection("users");
  const orgsCollection = db.collection("organizations");

  const { action } = await inquirer.prompt([
    {
      name: "action",
      type: "list",
      message: "Cosa vuoi fare?",
      choices: [
        {
          name: "👤 Crea un nuovo membro per un'Organizzazione ESISTENTE",
          value: "createMember",
        },
        { name: "✨ Inizializza una NUOVA Organizzazione", value: "initOrg" },
      ],
    },
  ]);

  if (action === "createMember") {
    // 1. Recupera e mostra le organizzazioni esistenti
    const allOrgs = await orgsCollection.find({}).toArray();
    if (allOrgs.length === 0) {
      console.error(
        "\n❌ ERRORE: Nessuna organizzazione trovata. Per favore, inizializzane una prima."
      );
      await clientMongo.close();
      return;
    }

    const { orgId, email, password, firstName, lastName, role } =
      await inquirer.prompt([
        {
          name: "orgId",
          type: "list",
          message: "Seleziona l'Organizzazione a cui appartiene l'utente:",
          choices: allOrgs.map((org) => ({
            name: org.name,
            value: org._id.toString(),
          })),
        },
        { name: "email", type: "input", message: "Email del nuovo utente:" },
        { name: "password", type: "input", message: "Password:" },
        { name: "firstName", type: "input", message: "Nome:" },
        { name: "lastName", type: "input", message: "Cognome:" },
        {
          name: "role",
          type: "list",
          message: "Scegli il ruolo:",
          choices: [
            { name: "Studente", value: "student" },
            { name: "Docente", value: "teacher" },
            { name: "Amministratore", value: "admin" },
          ],
        },
      ]);

    const newUser = await createAndLinkUser(db, {
      email,
      password,
      firstName,
      lastName,
      role,
      organizationIds: [new ObjectId(orgId)],
    });

    if (role === "admin") {
      await orgsCollection.updateOne(
        { _id: new ObjectId(orgId) },
        { $addToSet: { administrators: newUser._id } }
      );
    }
  } else {
    // initOrg
    const { orgName, adminAction } = await inquirer.prompt([
      {
        name: "orgName",
        type: "input",
        message: "Nome della nuova Organizzazione:",
      },
      {
        name: "adminAction",
        type: "list",
        message: "Scegli l'amministratore per questa organizzazione:",
        choices: [
          { name: "✨ Crea un NUOVO admin", value: "create" },
          {
            name: `🔗 Assegna l'admin esistente (${MASTER_ADMIN_EMAIL})`,
            value: "assign",
          },
        ],
      },
    ]);

    const newOrg = await orgsCollection.insertOne({
      name: orgName,
      administrators: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const newOrganizationId = newOrg.insertedId;

    let adminUser;

    if (adminAction === "create") {
      const { email, password, firstName, lastName } = await inquirer.prompt([
        {
          name: "email",
          type: "input",
          message: "Email del nuovo Amministratore:",
        },
        {
          name: "password",
          type: "input",
          message: "Password dell'Admin:",
        },
        { name: "firstName", type: "input", message: "Nome dell'Admin:" },
        { name: "lastName", type: "input", message: "Cognome dell'Admin:" },
      ]);
      adminUser = await createAndLinkUser(db, {
        email,
        password,
        firstName,
        lastName,
        role: "admin",
        organizationIds: [newOrganizationId],
      });
    } else {
      // assign
      const existingAdmin = await usersCollection.findOne({
        username: MASTER_ADMIN_EMAIL,
        role: "admin",
      });
      if (!existingAdmin) {
        throw new Error(`Admin master ${MASTER_ADMIN_EMAIL} non trovato.`);
      }
      await usersCollection.updateOne(
        { _id: existingAdmin._id },
        { $addToSet: { organizationIds: newOrganizationId } }
      );
      adminUser = await usersCollection.findOne({ _id: existingAdmin._id });
    }

    if (adminUser) {
      await orgsCollection.updateOne(
        { _id: newOrganizationId },
        { $set: { administrators: [adminUser._id] } }
      );
    }
  }

  await clientMongo.close();
};

start()
  .catch(console.error)
  .then(() => process.exit(0));
