import { loadEnvConfig } from '@next/env';
import { createDatabase } from './neon.ts';
import { loadMigrations, applyMigrations } from './migrations.mjs';

loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; confirm the intended database before migrating.');
try {
  const migrations = await loadMigrations();
  await applyMigrations(createDatabase(process.env.DATABASE_URL), migrations);
  console.log('Database migrations applied or already current (' + migrations.length + ' files).');
} catch {
  console.error('Migration failed. Verify connectivity, SQL and migration checksums. No database credentials are logged.');
  process.exitCode = 1;
}
