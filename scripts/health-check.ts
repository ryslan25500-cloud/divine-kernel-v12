#!/usr/bin/env node
/**
 * 🏥 DIVINE KERNEL V12 - Health Check Script
 */

import { Pool } from 'pg';
import { log } from '../src/utils/logger.js';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'divine_kernel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkDatabase(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const dbOk = await checkDatabase();
  
  console.log(JSON.stringify({
    status: dbOk ? 'healthy' : 'unhealthy',
    database: dbOk,
    timestamp: new Date().toISOString(),
  }, null, 2));
  
  await pool.end();
  process.exit(dbOk ? 0 : 1);
}

main();
