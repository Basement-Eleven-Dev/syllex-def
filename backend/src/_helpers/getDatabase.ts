import { Db, MongoClient } from "mongodb";
import { connect, connection } from 'mongoose';

import { DB_NAME } from "../env";
import { getSecret } from "./secrets/getSecret";

export const getDatabaseConnection = async (connectionString?: string): Promise<string> => {
  let connection = process.env.DATABASE_CONNECTION || connectionString;
  if (connection) return connection;
  let secretConnections = await getSecret("connection_strings_syllex");
  return JSON.parse(secretConnections)[process.env.STAGE as "stg" | "prod"];
};

let client: MongoClient | undefined;

export const mongoClient = async (
  connectionString?: string,
): Promise<MongoClient> => {
  if (!client) {
    client = new MongoClient(await getDatabaseConnection(connectionString));
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

/**
 * Mongoose Connection
 * @param connectionString 
 */
export const connectDatabase = async (connectionString?: string): Promise<void> => {
  if (connection.readyState == 1) return;
  await connect(await getDatabaseConnection(connectionString), { dbName: 'syllex' });

}