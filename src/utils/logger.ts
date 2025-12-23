/**
 * 📝 DIVINE KERNEL V12 - Logger
 */

import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'divine-kernel' },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

export const log = {
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  api: (method: string, path: string, status: number, duration?: number) => {
    logger.info(`${method} ${path} ${status}${duration ? ` (${duration}ms)` : ''}`);
  },
  rna: (message: string, ...args: any[]) => logger.info(`[RNA] ${message}`, ...args),
  dna: (message: string, ...args: any[]) => logger.info(`[DNA] ${message}`, ...args),
  db: (message: string, ...args: any[]) => logger.info(`[DB] ${message}`, ...args),
};

export default log;
