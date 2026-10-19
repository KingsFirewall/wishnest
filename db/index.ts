import "server-only";
import { createDatabase } from "./postgres";
import type { Database } from "./contract";

let db: Database | undefined;
export function getDb(): Database {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is missing. Use the Supabase transaction pooler connection string.");
    db = createDatabase(connectionString);
  }
  return db;
}
