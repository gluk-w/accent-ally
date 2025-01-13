import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

// Database setup with improved error handling and logging
function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Database connection cannot be established."
    );
  }

  try {
    console.log("Initializing database connection...");
    const db = drizzle({
      connection: process.env.DATABASE_URL,
      schema,
      ws: ws,
    });
    console.log("Database connection initialized successfully");
    return db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

export const db = setupDatabase();