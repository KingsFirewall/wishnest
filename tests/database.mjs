import { PGlite } from '@electric-sql/pglite';
import { loadMigrations, applyMigrations } from '../db/migrations.mjs';

export async function testDatabase() {
  const pg = new PGlite();
  const db = {
    execute: query => pg.query(query.text, query.params),
    batch: queries => pg.transaction(async tx => {
      await tx.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      const results = [];
      for (const query of queries) results.push(await tx.query(query.text, query.params));
      return results;
    }),
  };
  await applyMigrations(db, await loadMigrations());
  return { pg, db };
}
