import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import routes from './routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'RSM Exchange API', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'RSM Exchange API',
    version: '1.0.0',
    endpoints: { health: '/health', api: '/api', swap: '/api/swap', wallet: '/api/wallet', genomes: '/api/genomes', prices: '/api/prices' }
  });
});

app.listen(PORT, () => {
  logger.info('🚀 RSM Exchange API running on port ' + PORT);
  logger.info('📍 http://localhost:' + PORT);
});

export default app;
