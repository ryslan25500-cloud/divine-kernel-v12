import { Router, Request, Response } from 'express';
import { pool } from '../index';
import { logger } from '../utils/logger';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as total, AVG(consciousness)::int as avg_consciousness FROM human_genome');
    res.json({ success: true, stats: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching genome stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

router.get('/top', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, blockchain, consciousness, rsm_tokens_total FROM human_genome ORDER BY consciousness DESC LIMIT 10');
    res.json({ success: true, genomes: result.rows });
  } catch (error) {
    logger.error('Error fetching top genomes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch genomes' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM human_genome WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Genome not found' });
    }
    res.json({ success: true, genome: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching genome:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch genome' });
  }
});

export default router;
