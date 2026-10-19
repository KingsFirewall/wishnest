import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { neonConfig } from '@neondatabase/serverless';
import { createDatabase } from '../db/neon.ts';
import { sql } from '../db/sql.ts';
import { loadMigrations, applyMigrations } from '../db/migrations.mjs';
import { testDatabase } from './database.mjs';

test('SQL tag binds malicious values without inserting them into SQL text', () => {
  const value = "'); DROP TABLE wishes; --";
  assert.deepEqual(sql`SELECT ${value}, ${null}, ${123}`, { text: 'SELECT $1, $2, $3', params: [value, null, 123] });
});

test('Neon transport sends parameters and one ordered read-committed transaction', async t => {
  const previous = neonConfig.fetchFunction;
  t.after(() => { neonConfig.fetchFunction = previous; });
  const requests = [];
  neonConfig.fetchFunction = async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push({ body, headers: new Headers(options.headers) });
    const result = { fields: [{name: 'id', dataTypeID: 25}], rows: [['gift']], rowCount: 1, command: 'UPDATE' };
    return Response.json(body.queries ? { results: body.queries.map(() => result) } : result);
  };
  const db = createDatabase('postgresql://test:test@db.example.invalid/test');
  assert.equal((await db.execute(sql`SELECT ${"x'"} AS id`)).rows[0].id, 'gift');
  assert.equal(requests[0].body.query, 'SELECT $1 AS id');
  assert.deepEqual(requests[0].body.params, ["x'"]);
  const result = await db.batch([sql`SELECT ${1}`, sql`SELECT ${2}`, sql`SELECT ${3}`]);
  assert.equal(result.length, 3);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1].body.queries.map(q => q.params), [['1'], ['2'], ['3']]);
  assert.equal(requests[1].headers.get('Neon-Batch-Isolation-Level'), 'ReadCommitted');
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
