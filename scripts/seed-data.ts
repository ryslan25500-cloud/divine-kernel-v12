#!/usr/bin/env node
/**
 * 🌱 DIVINE KERNEL V12 - Seed Data Script
 */

import { Pool } from 'pg';
import { log } from '../src/utils/logger.js';
import { generateRandom } from '../src/dna/generator.js';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'divine_kernel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seedSequences(userId: string, count: number = 10): Promise<void> {
  for (let i = 1; i <= count; i++) {
    const seq = generateRandom(500 + Math.floor(Math.random() * 500));
    
    await pool.query(`
      INSERT INTO sequences (user_id, name, type, sequence, length, gc_content)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, `Sample ${i}`, 'dna', seq.sequence, seq.length, seq.gcContent]);
  }
  
  log.info(`Seeded ${count} sequences`);
}

async function main(): Promise<void> {
  try {
    log.info('🌱 Seeding data...');
    
    const userResult = await pool.query(`SELECT id FROM users LIMIT 1`);
    const userId = userResult.rows[0]?.id;
    
    if (userId) {
      await seedSequences(userId, 10);
    }
    
    log.info('✅ Seeding completed!');
  } catch (error) {
    log.error(`Seeding failed: ${error}`);
  } finally {
    await pool.end();
  }
}

main();
