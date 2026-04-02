import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { connection } from "mongoose";
import { lambdaPublicRequest } from "../../_helpers/lambdaProxyResponse";
import { connectDatabase } from "../../_helpers/getDatabase";

const checkHealth = async (request: APIGatewayProxyEvent, context: Context) => {
  const start = Date.now();
  
  // Ensure database is connected (throws if fails)
  await connectDatabase();
  
  // Perform a real ping to the database (throws if fails)
  if (connection.db) {
    await connection.db.admin().ping();
  } else {
    throw new Error("Database connection not initialized");
  }

  const duration = Date.now() - start;

  return {
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.STAGE || "development",
    database: {
      status: connection.readyState === 1 ? "connected" : "disconnected",
      latency_ms: duration,
    },
  };
};

export const handler = lambdaPublicRequest(checkHealth);