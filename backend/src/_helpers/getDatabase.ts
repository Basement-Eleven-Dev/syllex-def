import { Db, MongoClient } from "mongodb";

import { DB_NAME } from "../env";
import { getSecret } from "./secrets/getSecret";

export const getDatabaseConnection = async (): Promise<string> => {
  let secretConnections = await getSecret("connection_strings_syllex");
  return JSON.parse(secretConnections)[process.env.STAGE as "stg" | "prod"];
};

let client: MongoClient | undefined;

export const mongoClient = async (
  forceConnection?: string,
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
  return (await mongoClient()).db(dbName);
};
export const getDefaultDatabase = async (): Promise<Db> => {
  return await getDatabase(DB_NAME);
};
