import postgres from "postgres";
import type { Database, QueryResult } from "./contract.ts";

const local = (url: string) => ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);

// Supabase's transaction pooler (port 6543) does not support prepared
// statements, so `prepare: false` is required. All values stay bound parameters.
export function createDatabase(connectionString: string): Database & { close(): Promise<void> } {
  const client = postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    ssl: local(connectionString) ? false : "require",
  });
  const run = async (tx: postgres.Sql | postgres.TransactionSql, query: { text: string; params: unknown[] }): Promise<QueryResult> =>
    ({ rows: [...await tx.unsafe(query.text, query.params as postgres.ParameterOrJSON<never>[])] });
  return {
    execute: query => run(client, query),
    batch: async queries => await client.begin("isolation level read committed", async tx => {
      const results: QueryResult[] = [];
      for (const query of queries) results.push(await run(tx, query));
      return results;
    }) as QueryResult[],
    close: () => client.end({ timeout: 5 }),
  };
}
