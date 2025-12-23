/**
 * 🌍 DIVINE KERNEL V12 - Environment Configuration
 */

export function getEnvironmentVariable(name: string, defaultValue?: string): string {
  return process.env[name] || defaultValue || '';
}

export function getDatabaseConnectionString(): string {
  const host = getEnvironmentVariable('DB_HOST', 'localhost');
  const port = getEnvironmentVariable('DB_PORT', '5432');
  const database = getEnvironmentVariable('DB_NAME', 'divine_kernel');
  const user = getEnvironmentVariable('DB_USER', 'divine_user');
  const password = getEnvironmentVariable('DB_PASSWORD', '');
  
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

export function getPort(): number {
  return parseInt(process.env.PORT || '3000');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: getPort(),
  DB_HOST: getEnvironmentVariable('DB_HOST', 'localhost'),
  DB_PORT: parseInt(getEnvironmentVariable('DB_PORT', '5432')),
  DB_NAME: getEnvironmentVariable('DB_NAME', 'divine_kernel'),
  DB_USER: getEnvironmentVariable('DB_USER', 'divine_user'),
  DB_PASSWORD: getEnvironmentVariable('DB_PASSWORD', ''),
  JWT_SECRET: getEnvironmentVariable('JWT_SECRET', 'secret'),
};

export const ENV = env;

export default {
  getEnvironmentVariable,
  getDatabaseConnectionString,
  isDevelopment,
  isProduction,
  isTest,
  getPort,
  env,
  ENV,
};
