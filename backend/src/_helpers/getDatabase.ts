import { Db, MongoClient } from "mongodb";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager"; // ES Modules import
import { DB_NAME } from "../env";

const getFreshSecret = async (secretId: string): Promise<string> => {
  const client = new SecretsManagerClient();
  const input = {
    SecretId: secretId,
  };
  const command = new GetSecretValueCommand(input);
  const response = await client.send(command);
  return response.SecretString || "{}";
};

export const getSecret = async (secretId: string): Promise<string> => {
  if (process.env.STAGE == "stg" || !!process.env.LOCAL_TESTING) return await getFreshSecret(secretId);
  else {
    let request = await fetch(
      `http://localhost:${process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT}/secretsmanager/get?secretId=${secretId}`,
      {
        headers: {
          "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN || "",
        },
      }
    );
    let res = await request.json();
    if (!res.SecretString) throw new Error("No secret string found");
    return res.SecretString as string;
  }
};

export const getDatabaseConnection = async (): Promise<string> => {
  let secretConnections = await getSecret("connection_strings_syllex");
  return JSON.parse(secretConnections)[process.env.STAGE as "stg" | "prod"];
};

let client: MongoClient | undefined;

export const mongoClient = async (
  forceConnection?: string
): Promise<MongoClient> => {
  if (!client) {
    let connection = process.env.DATABASE_CONNECTION || forceConnection;
    if (!connection) connection = await getDatabaseConnection();
    client = new MongoClient(connection);
    await client.connect();
  }
  return client;
};

export const getDatabase = async (dbName: string): Promise<Db> => {
  return (await mongoClient()).db(dbName)
}
export const getDefaultDatabase = async (): Promise<Db> => {
  return await getDatabase(DB_NAME)
}