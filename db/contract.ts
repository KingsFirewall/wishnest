import type { SQL } from "./sql.ts";

export type Row = Record<string, unknown>;
export type QueryResult = { rows: Row[] };
export interface Database {
  execute(query: SQL): Promise<QueryResult>;
  /** Ordered statements in one transaction (read committed). */
  batch(queries: [SQL, ...SQL[]]): Promise<QueryResult[]>;
}
