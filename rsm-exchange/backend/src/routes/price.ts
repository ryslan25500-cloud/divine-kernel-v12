import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

const prices: Record<string, number> = {
  RSM: 10000,
  SOL: 100,
  ETH: 2500,
  BTC: 100000,
  USDT: 1,
  USDC: 1
};

router.get('/', async (req: Request, res: Response) => {
  res.json({ success: true, prices, timestamp: new Date().toISOString() });
});

router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  const price = prices[token.toUpperCase()];
  if (!price) {
    return res.status(404).json({ success: false, error: 'Token not found' });
  }
  res.json({ success: true, token: token.toUpperCase(), price, timestamp: new Date().toISOString() });
});

export default router;
