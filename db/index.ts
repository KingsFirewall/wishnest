import "server-only";
import { createDatabase } from "./neon";
import type { Database } from "./contract";

let db: Database | undefined;
export function getDb(): Database {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is missing. Connect a Postgres database before using the API.");
    db = createDatabase(connectionString);
  }
  return db;
}
