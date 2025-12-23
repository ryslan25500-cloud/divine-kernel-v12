#!/usr/bin/env node
/**
 * 💾 DIVINE KERNEL V12 - Backup Script
 * 
 * Создание резервных копий базы данных и важных файлов.
 * Поддержка полного и инкрементального backup.
 */

import { Pool } from 'pg';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { log } from '../src/utils/logger.js';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════
// 🗄️ DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'divine_kernel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// ═══════════════════════════════════════════════════════════
// 💾 BACKUP CONFIGURATION
// ═══════════════════════════════════════════════════════════

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '10');

// ═══════════════════════════════════════════════════════════
// 📦 DATABASE BACKUP
// ═══════════════════════════════════════════════════════════

async function backupDatabase(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `divine_kernel_${timestamp}.sql`;
  const filepath = join(BACKUP_DIR, filename);
  
  log.info(`Creating database backup: ${filename}`);
  
  // Создаём директорию если не существует
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true });
  }
  
  // pg_dump команда
  const command = `pg_dump -h ${process.env.DB_HOST || 'localhost'} ` +
    `-p ${process.env.DB_PORT || '5432'} ` +
    `-U ${process.env.DB_USER || 'postgres'} ` +
    `-d ${process.env.DB_NAME || 'divine_kernel'} ` +
    `-f ${filepath}`;
  
  try {
    await execAsync(command);
    log.info(`✅ Database backup created: ${filepath}`);
    return filepath;
  } catch (error) {
    log.error(`Database backup failed: ${error}`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// 📊 TABLE EXPORT
// ═══════════════════════════════════════════════════════════

async function exportTable(tableName: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${tableName}_${timestamp}.json`;
  const filepath = join(BACKUP_DIR, filename);
  
  log.info(`Exporting table: ${tableName}`);
  
  const result = await pool.query(`SELECT * FROM ${tableName}`);
  const data = {
    table: tableName,
    timestamp: new Date().toISOString(),
    rowCount: result.rowCount,
    data: result.rows,
  };
  
  await writeFile(filepath, JSON.stringify(data, null, 2));
  log.info(`✅ Table exported: ${filepath}`);
}

// ═══════════════════════════════════════════════════════════
// 🗜️ COMPRESSION
// ═══════════════════════════════════════════════════════════

async function compressBackup(filepath: string): Promise<string> {
  const compressedPath = `${filepath}.gz`;
  
  log.info(`Compressing backup: ${filepath}`);
  
  await execAsync(`gzip -f ${filepath}`);
  
  log.info(`✅ Backup compressed: ${compressedPath}`);
  return compressedPath;
}

// ═══════════════════════════════════════════════════════════
// 🧹 CLEANUP OLD BACKUPS
// ═══════════════════════════════════════════════════════════

async function cleanupOldBackups(): Promise<void> {
  log.info('Cleaning up old backups...');
  
  try {
    const { stdout } = await execAsync(`ls -t ${BACKUP_DIR}/*.sql.gz 2>/dev/null || true`);
    const files = stdout.split('\n').filter(f => f);
    
    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      
      for (const file of toDelete) {
        await execAsync(`rm ${file}`);
        log.info(`Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    log.warn(`Cleanup failed: ${error}`);
  }
}

// ═══════════════════════════════════════════════════════════
// 📈 BACKUP STATISTICS
// ═══════════════════════════════════════════════════════════

async function getBackupStats(): Promise<BackupStats> {
  const tables = [
    'users',
    'sequences',
    'genomes',
    'trees',
    'jobs',
  ];
  
  const stats: Record<string, number> = {};
  
  for (const table of tables) {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
    stats[table] = parseInt(result.rows[0].count);
  }
  
  return {
    tables: stats,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════
// 🚀 MAIN BACKUP FUNCTION
// ═══════════════════════════════════════════════════════════

async function performBackup(options: BackupOptions = {}): Promise<void> {
  const {
    compress = true,
    exportTables = [],
    cleanup = true,
  } = options;
  
  try {
    log.info('💾 Starting backup process...');
    
    // Статистика перед backup
    const stats = await getBackupStats();
    log.info('Database statistics:', stats);
    
    // Backup базы данных
    let backupPath = await backupDatabase();
    
    // Компрессия
    if (compress) {
      backupPath = await compressBackup(backupPath);
    }
    
    // Экспорт отдельных таблиц
    for (const table of exportTables) {
      await exportTable(table);
    }
    
    // Очистка старых backup
    if (cleanup) {
      await cleanupOldBackups();
    }
    
    log.info('🎉 Backup completed successfully!');
    log.info(`Backup file: ${backupPath}`);
  } catch (error) {
    log.error(`Backup failed: ${error}`);
    throw error;
  } finally {
    await pool.end();
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 CLI
// ═══════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'full':
        await performBackup({ compress: true, cleanup: true });
        break;
      case 'tables':
        await performBackup({
          compress: true,
          exportTables: ['sequences', 'genomes', 'trees'],
          cleanup: true,
        });
        break;
      case 'stats':
        const stats = await getBackupStats();
        console.log('Database Statistics:');
        console.log(JSON.stringify(stats, null, 2));
        await pool.end();
        break;
      default:
        console.log(`
Usage: npm run backup [command]

Commands:
  full      Full database backup (default)
  tables    Backup with table exports
  stats     Show database statistics

Environment variables:
  BACKUP_DIR      Backup directory (default: ./backups)
  MAX_BACKUPS     Maximum number of backups to keep (default: 10)
        `);
    }
  } catch (error) {
    log.error(`Backup failed: ${error}`);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

interface BackupOptions {
  compress?: boolean;
  exportTables?: string[];
  cleanup?: boolean;
}

interface BackupStats {
  tables: Record<string, number>;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════
// 🎯 RUN
// ═══════════════════════════════════════════════════════════

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export { performBackup, getBackupStats };
