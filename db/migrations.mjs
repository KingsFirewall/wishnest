import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function loadMigrations(directory = new URL('./migrations/', import.meta.url)) {
  const files = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
  if (!files.length) throw new Error('No SQL migrations found.');
  return Promise.all(files.map(async name => {
    if (!/^\d{4}_[a-z0-9_]+\.sql$/.test(name)) throw new Error('Invalid migration filename.');
    const text = await readFile(new URL(name, directory), 'utf8');
    return { name, text, checksum: createHash('sha256').update(text).digest('hex') };
  }));
}

export async function applyMigrations(db, migrations) {
  const statements = [
    { text: "SELECT pg_advisory_xact_lock(hashtextextended('wishnest-schema-migrations', 0))", params: [] },
    { text: 'CREATE TABLE IF NOT EXISTS wishnest_schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())', params: [] },
  ];
  for (const migration of migrations) {
    const {name, text, checksum} = migration;
    // This is trusted, repository-owned DDL, never request input. Both interpolated
    // literals have strict allowlists. Ordinary app queries use bound parameters.
    if (!/^\d{4}_[a-z0-9_]+\.sql$/.test(name) || !/^[a-f0-9]{64}$/.test(checksum) ||
        text.includes('$wishnest_migration$')) throw new Error('Invalid migration.');
    statements.push({ text: `DO $wishnest_migration$
BEGIN
  IF EXISTS (SELECT 1 FROM wishnest_schema_migrations WHERE name='${name}' AND checksum <> '${checksum}') THEN
    RAISE EXCEPTION 'Applied migration checksum changed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM wishnest_schema_migrations WHERE name='${name}') THEN
    ${text}
    INSERT INTO wishnest_schema_migrations (name, checksum) VALUES ('${name}', '${checksum}');
  END IF;
END
$wishnest_migration$;`, params: [] });
  }
  // Lock acquisition is its own statement; all DDL and history commit together.
  await db.batch(statements);
}
