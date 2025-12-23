/**
 * 🗄️ DIVINE KERNEL V12 - Database Connection
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { log } from '../../utils/logger.js';
import { ENV } from '../config/environment.js';
import { DATABASE } from '../config/constants.js';

class DatabaseConnection {
  private pool: Pool | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      this.pool = new Pool({
        host: ENV.DB_HOST,
        port: ENV.DB_PORT,
        database: ENV.DB_NAME,
        user: ENV.DB_USER,
        password: ENV.DB_PASSWORD,
        min: DATABASE.POOL_MIN,
        max: DATABASE.POOL_MAX,
        idleTimeoutMillis: DATABASE.IDLE_TIMEOUT,
        connectionTimeoutMillis: DATABASE.CONNECTION_TIMEOUT,
      });

      await this.pool.query('SELECT 1');
      this.isConnected = true;
      log.db('Database connected successfully');
    } catch (error) {
      log.error(`Database connection failed: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      log.db('Database disconnected');
    }
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.pool.query<T>(text, params);
      return result;
    } catch (error) {
      log.error(`Query failed: ${error}`);
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return await this.pool.connect();
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.pool !== null;
  }
}

export const db = new DatabaseConnection();
export default db;
