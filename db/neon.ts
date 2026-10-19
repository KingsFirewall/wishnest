import { neon } from "@neondatabase/serverless";
import type { Database } from "./contract.ts";

export function createDatabase(connectionString: string): Database {
  const client = neon(connectionString);
  return {
    execute: async query => client.query(query.text, query.params, { fullResults: true }),
    batch: async queries => client.transaction(
      queries.map(query => client.query(query.text, query.params)),
      { fullResults: true, isolationLevel: "ReadCommitted" },
    ),
  };
}
