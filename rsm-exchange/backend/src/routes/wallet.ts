import { Router, Request, Response } from 'express';
import { pool } from '../index';
import { logger } from '../utils/logger';

const router = Router();

router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const result = await pool.query('SELECT * FROM rsm_wallets WHERE address = $1', [address]);
    
    if (result.rows.length === 0) {
      return res.json({ success: true, wallet: { address, balance: 0, consciousness: 0, isNew: true } });
    }
    res.json({ success: true, wallet: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching wallet:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch wallet' });
  }
});

router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    const existing = await pool.query('SELECT * FROM rsm_wallets WHERE address = $1', [address]);
    
    if (existing.rows.length > 0) {
      return res.json({ success: true, wallet: existing.rows[0], isNew: false });
    }
    
    const result = await pool.query(
      "INSERT INTO rsm_wallets (address, balance, consciousness_level, wallet_type) VALUES ($1, 0, 10, 'standard') RETURNING *",
      [address]
    );
    res.json({ success: true, wallet: result.rows[0], isNew: true });
  } catch (error) {
    logger.error('Error connecting wallet:', error);
    res.status(500).json({ success: false, error: 'Failed to connect wallet' });
  }
});

export default router;
