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

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  sequence TEXT NOT NULL,
  length INTEGER NOT NULL,
  gc_content FLOAT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS genomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  organism VARCHAR(255),
  topology VARCHAR(50),
  annotations JSONB,
  statistics JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  newick TEXT NOT NULL,
  method VARCHAR(100),
  statistics JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  input JSONB,
  output JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sequences_user_id ON sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_genomes_user_id ON genomes(user_id);
CREATE INDEX IF NOT EXISTS idx_trees_user_id ON trees(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
`;

async function setupDatabase(): Promise<void> {
  try {
    log.info('🗄️ Setting up Divine Kernel database...');
    
    log.info('Creating tables...');
    await pool.query(CREATE_TABLES);
    log.info('✅ Tables created');
    
    log.info('Creating indexes...');
    await pool.query(CREATE_INDEXES);
    log.info('✅ Indexes created');
    
    log.info('Inserting default data...');
    await pool.query(`
      INSERT INTO users (email, password_hash, role)
      VALUES ('admin@divine-kernel.ai', '$2b$10$example', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
    log.info('✅ Default data inserted');
    
    log.info('🎉 Database setup completed successfully!');
  } catch (error) {
    log.error(`Database setup failed: ${error}`);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
