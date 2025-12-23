#!/usr/bin/env node
import 'dotenv/config';
import { Pool } from 'pg';
import { log } from '../src/utils/logger.js';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'divine_kernel',
  user: process.env.DB_USER || 'divine_user',
  password: process.env.DB_PASSWORD || '2480',
});

interface Migration {
  version: string;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: '12.0.0',
    name: 'Initial schema',
    up: async () => {
      log.info('Running migration 12.0.0...');
    },
    down: async () => {
      log.info('Rolling back migration 12.0.0...');
      await pool.query('DROP TABLE IF EXISTS jobs CASCADE');
      await pool.query('DROP TABLE IF EXISTS trees CASCADE');
      await pool.query('DROP TABLE IF EXISTS genomes CASCADE');
      await pool.query('DROP TABLE IF EXISTS sequences CASCADE');
      await pool.query('DROP TABLE IF EXISTS users CASCADE');
    },
  },
];

async function createMigrationTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      version VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query('SELECT version FROM migrations ORDER BY version');
  return result.rows.map(row => row.version);
}

async function recordMigration(version: string, name: string): Promise<void> {
  await pool.query(
    'INSERT INTO migrations (version, name) VALUES ($1, $2)',
    [version, name]
  );
}

async function migrateUp(): Promise<void> {
  log.info('🔄 Running migrations...');
  
  await createMigrationTable();
  const applied = await getAppliedMigrations();
  
  for (const migration of migrations) {
    if (!applied.includes(migration.version)) {
      log.info(`Applying migration ${migration.version}: ${migration.name}`);
      
      try {
        await migration.up();
        await recordMigration(migration.version, migration.name);
        log.info(`✅ Migration ${migration.version} applied`);
      } catch (error) {
        log.error(`❌ Migration ${migration.version} failed: ${error}`);
        throw error;
      }
    } else {
      log.debug(`Migration ${migration.version} already applied`);
    }
  }
  
  log.info('🎉 All migrations completed!');
}

async function main(): Promise<void> {
  try {
    await migrateUp();
  } catch (error) {
    log.error(`Migration failed: ${error}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
