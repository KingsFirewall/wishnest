import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sql } from '../db/sql.ts';
import { loadMigrations, applyMigrations } from '../db/migrations.mjs';
import { testDatabase } from './database.mjs';

test('SQL tag binds malicious values without inserting them into SQL text', () => {
  const value = "'); DROP TABLE wishes; --";
  assert.deepEqual(sql`SELECT ${value}, ${null}, ${123}`, { text: 'SELECT $1, $2, $3', params: [value, null, 123] });
});

test('every app table has row level security so the Supabase Data API cannot reach it', async t => {
  const {pg} = await testDatabase();
  t.after(() => pg.close());
  const {rows} = await pg.query("SELECT relname, relrowsecurity FROM pg_class WHERE relkind='r' AND relnamespace='public'::regnamespace ORDER BY relname");
  assert.deepEqual(rows.map(r => r.relname), ['celebrations', 'images', 'wishes', 'wishnest_schema_migrations']);
  for (const row of rows) assert.equal(row.relrowsecurity, true, row.relname);
});

test('migrations are repeatable, reject modified history, and roll back failed DDL', async t => {
  const {pg, db} = await testDatabase();
  t.after(() => pg.close());
  const migrations = await loadMigrations();
  await Promise.all([applyMigrations(db, migrations), applyMigrations(db, migrations)]);
  assert.equal((await pg.query('SELECT * FROM wishnest_schema_migrations')).rows.length, migrations.length);
  await assert.rejects(applyMigrations(db, [{...migrations[0], checksum: '0'.repeat(64)}]), /checksum changed/);
  const text = 'CREATE TABLE rollback_probe (id text); SELECT 1 / 0;';
  await assert.rejects(applyMigrations(db, [{name: '0001_failure.sql', text, checksum: createHash('sha256').update(text).digest('hex')}]));
  assert.equal((await pg.query("SELECT to_regclass('rollback_probe') AS name")).rows[0].name, null);
  assert.equal((await pg.query('SELECT * FROM wishnest_schema_migrations')).rows.length, migrations.length);
});
