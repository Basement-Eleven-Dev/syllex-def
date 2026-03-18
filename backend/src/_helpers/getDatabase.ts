import { connect, connection } from 'mongoose';

import { DB_NAME } from "../env";
import { getSecret } from "./secrets/getSecret";

const getDatabaseConnection = async (connectionString?: string): Promise<string> => {
  let connection = process.env.DATABASE_CONNECTION || connectionString;
  if (connection) return connection;
  let secretConnections = await getSecret("connection_strings_syllex");
  return JSON.parse(secretConnections)[process.env.STAGE as "stg" | "prod"];
};

/**
 * Mongoose Connection
 * @param connectionString 
 */
export const connectDatabase = async (connectionString?: string): Promise<void> => {
  if (connection.readyState == 1) return;
  await connect(await getDatabaseConnection(connectionString), { dbName: 'syllex' });

}