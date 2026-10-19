import { loadEnvConfig } from '@next/env';
import { createDatabase } from './postgres.ts';
import { loadMigrations, applyMigrations } from './migrations.mjs';

loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; confirm the intended database before migrating.');
const db = createDatabase(process.env.DATABASE_URL);
try {
  const migrations = await loadMigrations();
  await applyMigrations(db, migrations);
  console.log('Database migrations applied or already current (' + migrations.length + ' files).');
} catch {
  console.error('Migration failed. Verify connectivity, SQL and migration checksums. No database credentials are logged.');
  process.exitCode = 1;
} finally {
  await db.close();
}
