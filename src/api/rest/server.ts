/**
 * 🌐 DIVINE KERNEL V12 - Express Server
 * 
 * Главный HTTP сервер для REST API.
 * Express с middleware, CORS, rate limiting, и GraphQL.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import router from './routes.js';
import { log } from '../../utils/logger.js';
import { getEnvironmentVariable } from '../../core/config/environment.js';

// ═══════════════════════════════════════════════════════════
// 🌐 SERVER CLASS
// ═══════════════════════════════════════════════════════════

export class DivinKernelServer {
  private app: Express;
  private port: number;
  
  constructor(options: ServerOptions = {}) {
    this.port = options.port || parseInt(getEnvironmentVariable('PORT') || '3000');
    this.app = express();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  /**
   * Настраивает middleware
   */
  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: false, // Для GraphQL playground
    }));
    
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));
    
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use(this.requestLogger);
    
    // Rate limiting (простая реализация)
    this.app.use(this.rateLimiter);
    
    log.info('Middleware configured');
  }
  
  /**
   * Логирование запросов
   */
  private requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      log.api(req.method, req.path, res.statusCode, duration);
    });
    
    next();
  }
  
  /**
   * Rate limiting
   */
  private rateLimiter(req: Request, res: Response, next: NextFunction): void {
    // Упрощённая реализация
    // В production использовать express-rate-limit
    
    const ip = req.ip;
    const key = `ratelimit:${ip}`;
    
    // TODO: Implement proper rate limiting with Redis
    
    next();
  }
  
  /**
   * Настраивает маршруты
   */
  private setupRoutes(): void {
    // API routes
    this.app.use('/api', router);
    
    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Divine Kernel V12 API',
        version: '12.0.0',
        status: 'running',
        endpoints: {
          api: '/api',
          health: '/api/health',
          docs: '/api/docs',
          graphql: '/graphql',
        },
      });
    });
    
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    });
    
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method,
      });
    });
    
    log.info('Routes configured');
  }
  
  /**
   * Настраивает обработку ошибок
   */
  private setupErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      log.error(`Server error: ${err.message}`, err.stack);
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    });
  }
  
  /**
   * Запускает сервер
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        log.info(`🚀 Divine Kernel V12 server running on port ${this.port}`);
        log.info(`📍 API: http://localhost:${this.port}/api`);
        log.info(`📍 Health: http://localhost:${this.port}/health`);
        resolve();
      });
    });
  }
  
  /**
   * Останавливает сервер
   */
  async stop(): Promise<void> {
    log.info('Stopping server...');
    // TODO: Implement graceful shutdown
  }
  
  /**
   * Возвращает Express app (для тестов)
   */
  getApp(): Express {
    return this.app;
  }
}

// ═══════════════════════════════════════════════════════════
// 🚀 SERVER INSTANCE
// ═══════════════════════════════════════════════════════════

let serverInstance: DivinKernelServer | null = null;

/**
 * Создаёт и запускает сервер
 */
export async function startServer(options?: ServerOptions): Promise<DivinKernelServer> {
  if (serverInstance) {
    throw new Error('Server already running');
  }
  
  serverInstance = new DivinKernelServer(options);
  await serverInstance.start();
  
  return serverInstance;
}

/**
 * Останавливает сервер
 */
export async function stopServer(): Promise<void> {
  if (serverInstance) {
    await serverInstance.stop();
    serverInstance = null;
  }
}

/**
 * Возвращает текущий instance сервера
 */
export function getServer(): DivinKernelServer | null {
  return serverInstance;
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface ServerOptions {
  port?: number;
  corsOrigin?: string;
  enableGraphQL?: boolean;
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  DivinKernelServer,
  startServer,
  stopServer,
  getServer,
};
