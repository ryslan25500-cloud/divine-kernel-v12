#!/usr/bin/env node
/**
 * 📊 DIVINE KERNEL V12 - Monitoring Script
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

async function getSystemStats() {
  const stats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM sequences) as sequences,
      (SELECT COUNT(*) FROM genomes) as genomes,
      (SELECT COUNT(*) FROM trees) as trees,
      (SELECT COUNT(*) FROM jobs WHERE status = 'running') as active_jobs
  `);
  
  return stats.rows[0];
}

async function main(): Promise<void> {
  try {
    log.info('📊 System Monitor');
    const stats = await getSystemStats();
    console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    log.error(`Monitoring failed: ${error}`);
  } finally {
    await pool.end();
  }
}

main();
