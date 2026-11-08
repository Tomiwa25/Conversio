import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment configuration
dotenv.config();

const { Pool } = pg;

export async function runMigrations(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://conversio_admin:conversio_secure_db_password_2026@localhost:5432/conversio';

  console.log('🔄 [Database Migrations] Initializing migration runner...');
  console.log(`📡 Target Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  try {
    // 1. Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully.');

    // 2. Ensure schema_migrations ledger table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Locate SQL migration files
    let migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.resolve(process.cwd(), 'src/db/migrations');
    }
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.resolve(process.cwd(), 'apps/server/src/db/migrations');
    }
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`⚠️ Migrations directory not found at: ${migrationsDir}`);
      client.release();
      await pool.end();
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    // 4. Retrieve already executed migrations
    const executedRes = await client.query('SELECT name FROM schema_migrations');
    const executedNames = new Set(executedRes.rows.map((r: { name: string }) => r.name));

    let appliedCount = 0;

    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`  ⏭️  Skipped (already applied): ${file}`);
        continue;
      }

      console.log(`  ⏳ Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute within an atomic transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✅ Successfully applied: ${file}`);
        appliedCount++;
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Failed to apply migration: ${file}`);
        throw migrationErr;
      }
    }

    client.release();
    console.log(`\n🎉 [Database Migrations] Done! Applied ${appliedCount} new migration(s).`);
  } catch (err: any) {
    console.error('\n❌ [Database Migrations] Migration failed:');
    console.error(`   Error message: ${err.message}`);
    console.error('\n💡 Troubleshooting Tip:');
    console.error('   Ensure PostgreSQL is running locally or in Docker:');
    console.error('   Run: docker-compose up -d postgres\n');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

// Execute directly if run as a CLI script
if (process.argv[1]?.includes('migrate')) {
  runMigrations();
}
