#!/usr/bin/env node
/**
 * 🧹 DIVINE KERNEL V12 - Cleanup Script
 * 
 * Очистка временных файлов, кешей, и старых данных.
 */

import { Pool } from 'pg';
import { rm, readdir } from 'fs/promises';
import { join } from 'path';
import { log } from '../src/utils/logger.js';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'divine_kernel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function cleanOldJobs(): Promise<number> {
  const result = await pool.query(`
    DELETE FROM jobs 
    WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '7 days'
    RETURNING id
  `);
  
  return result.rowCount || 0;
}

async function cleanOldLogs(): Promise<number> {
  const result = await pool.query(`
    DELETE FROM logs 
    WHERE timestamp < NOW() - INTERVAL '30 days'
    RETURNING id
  `);
  
  return result.rowCount || 0;
}

async function cleanTempFiles(): Promise<number> {
  const tempDir = './temp';
  let count = 0;
  
  try {
    const files = await readdir(tempDir);
    for (const file of files) {
      await rm(join(tempDir, file), { force: true });
      count++;
    }
  } catch (error) {
    log.warn(`Temp directory not found: ${tempDir}`);
  }
  
  return count;
}

async function main(): Promise<void> {
  try {
    log.info('🧹 Starting cleanup...');
    
    const jobsDeleted = await cleanOldJobs();
    log.info(`Deleted ${jobsDeleted} old jobs`);
    
    const logsDeleted = await cleanOldLogs();
    log.info(`Deleted ${logsDeleted} old logs`);
    
    const filesDeleted = await cleanTempFiles();
    log.info(`Deleted ${filesDeleted} temp files`);
    
    log.info('✅ Cleanup completed!');
  } catch (error) {
    log.error(`Cleanup failed: ${error}`);
  } finally {
    await pool.end();
  }
}

main();
