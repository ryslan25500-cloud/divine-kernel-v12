import { Router } from 'express';
import swapRoutes from './swap';
import walletRoutes from './wallet';
import genomeRoutes from './genome';
import priceRoutes from './price';

const router = Router();

// API Status
router.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'RSM Exchange',
    version: '1.0.0',
    routes: ['/swap', '/wallet', '/genomes', '/prices']
  });
});

// Mount Routes
router.use('/swap', swapRoutes);
router.use('/wallet', walletRoutes);
router.use('/genomes', genomeRoutes);
router.use('/prices', priceRoutes);

export default router;
