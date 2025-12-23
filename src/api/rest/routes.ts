/**
 * 🌐 DIVINE KERNEL V12 - REST API Routes
 * 
 * Определение маршрутов REST API для Divine Kernel.
 * Express-based API с полной документацией endpoints.
 */

import { Router, Request, Response } from 'express';
import { DNASequence } from '../../dna/sequence.js';
import { generateRandom } from '../../dna/generator.js';
import { mutate } from '../../dna/mutations.js';
import { transcribe } from '../../rna/transcription.js';
import { translate } from '../../rna/translation/protein-synthesis.js';
import { neighborJoining } from '../../tree/algorithms/neighbor-joining.js';
import { hammingDistanceDNA } from '../../tree/distance/hamming.js';
import { renderTree } from '../../tree/visualization/svg-renderer.js';
import { toNewick } from '../../tree/visualization/newick.js';
import { GeneFinder } from '../../genome/gene-generation/gene-finder.js';
import { log } from '../../utils/logger.js';

// ═══════════════════════════════════════════════════════════
// 🌐 MAIN ROUTER
// ═══════════════════════════════════════════════════════════

export const router = Router();

// ═══════════════════════════════════════════════════════════
// 🏠 HEALTH CHECK
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/health
 * Проверка состояния API
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '12.0.0',
    service: 'Divine Kernel V12',
  });
});

// ═══════════════════════════════════════════════════════════
// 🧬 DNA ENDPOINTS
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/dna/generate
 * Генерирует случайную ДНК последовательность
 * 
 * Body: { length: number, gcContent?: number }
 */
router.post('/dna/generate', (req: Request, res: Response) => {
  try {
    const { length, gcContent = 0.5 } = req.body;
    
    if (!length || length < 10 || length > 100000) {
      return res.status(400).json({
        error: 'Invalid length (must be between 10 and 100000)',
      });
    }
    
    const sequence = generateRandom(length, { gcContent });
    
    log.api(req.method, req.path, 200);
    
    res.json({
      sequence: sequence.sequence,
      length: sequence.length,
      gcContent: sequence.gcContent,
      statistics: sequence.getStatistics(),
    });
  } catch (error: any) {
    log.error(`Error in /dna/generate: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/dna/analyze
 * Анализирует ДНК последовательность
 * 
 * Body: { sequence: string }
 */
router.post('/dna/analyze', (req: Request, res: Response) => {
  try {
    const { sequence } = req.body;
    
    if (!sequence) {
      return res.status(400).json({ error: 'Sequence is required' });
    }
    
    const dna = new DNASequence(sequence);
    const orfs = dna.findORFs();
    
    log.api(req.method, req.path, 200);
    
    res.json({
      length: dna.length,
      gcContent: dna.gcContent,
      nucleotideCounts: dna.nucleotideCounts,
      orfs: orfs.map(orf => ({
        start: orf.start,
        end: orf.end,
        length: orf.length,
        strand: orf.strand,
        frame: orf.frame,
      })),
      statistics: dna.getStatistics(),
    });
  } catch (error: any) {
    log.error(`Error in /dna/analyze: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/dna/mutate
 * Применяет мутации к последовательности
 * 
 * Body: { sequence: string, mutationRate?: number }
 */
router.post('/dna/mutate', (req: Request, res: Response) => {
  try {
    const { sequence, mutationRate = 0.01 } = req.body;
    
    if (!sequence) {
      return res.status(400).json({ error: 'Sequence is required' });
    }
    
    const dna = new DNASequence(sequence);
    const { sequence: mutated, mutations } = mutate(dna, {
      pointMutationRate: mutationRate,
    });
    
    log.api(req.method, req.path, 200);
    
    res.json({
      original: dna.sequence,
      mutated: mutated.sequence,
      mutationCount: mutations.length,
      mutations: mutations.map(m => ({
        type: m.type,
        position: m.position,
        description: m.description,
      })),
    });
  } catch (error: any) {
    log.error(`Error in /dna/mutate: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📝 RNA ENDPOINTS
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/rna/transcribe
 * Транскрибирует ДНК в РНК
 * 
 * Body: { sequence: string }
 */
router.post('/rna/transcribe', (req: Request, res: Response) => {
  try {
    const { sequence } = req.body;
    
    if (!sequence) {
      return res.status(400).json({ error: 'Sequence is required' });
    }
    
    const dna = new DNASequence(sequence);
    const rna = transcribe(dna);
    
    log.api(req.method, req.path, 200);
    
    res.json({
      dna: dna.sequence,
      rna: rna.sequence,
      length: rna.length,
    });
  } catch (error: any) {
    log.error(`Error in /rna/transcribe: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rna/translate
 * Транслирует РНК в белок
 * 
 * Body: { sequence: string }
 */
router.post('/rna/translate', (req: Request, res: Response) => {
  try {
    const { sequence } = req.body;
    
    if (!sequence) {
      return res.status(400).json({ error: 'Sequence is required' });
    }
    
    const dna = new DNASequence(sequence);
    const rna = transcribe(dna);
    const protein = translate(rna);
    
    log.api(req.method, req.path, 200);
    
    res.json({
      dna: dna.sequence,
      rna: rna.sequence,
      protein: protein.sequence,
      proteinLength: protein.length,
      molecularWeight: protein.getMolecularWeight(),
    });
  } catch (error: any) {
    log.error(`Error in /rna/translate: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 🌳 TREE ENDPOINTS
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/tree/build
 * Строит филогенетическое дерево
 * 
 * Body: { sequences: Array<{ id: string, name: string, sequence: string }> }
 */
router.post('/tree/build', (req: Request, res: Response) => {
  try {
    const { sequences } = req.body;
    
    if (!sequences || sequences.length < 2) {
      return res.status(400).json({
        error: 'At least 2 sequences required',
      });
    }
    
    // Конвертируем в DNASequence
    const dnaSequences = sequences.map((s: any) => ({
      id: s.id,
      name: s.name,
      sequence: new DNASequence(s.sequence),
    }));
    
    // Строим дерево
    const tree = neighborJoining(dnaSequences, hammingDistanceDNA);
    
    // Конвертируем в Newick
    const newick = toNewick(tree);
    
    log.api(req.method, req.path, 200);
    
    res.json({
      newick,
      statistics: tree.getStatistics(),
      nodeCount: tree.size,
      height: tree.height,
    });
  } catch (error: any) {
    log.error(`Error in /tree/build: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tree/visualize
 * Визуализирует дерево в SVG
 * 
 * Body: { sequences: Array, style?: string }
 */
router.post('/tree/visualize', (req: Request, res: Response) => {
  try {
    const { sequences, style = 'rectangular' } = req.body;
    
    if (!sequences || sequences.length < 2) {
      return res.status(400).json({
        error: 'At least 2 sequences required',
      });
    }
    
    const dnaSequences = sequences.map((s: any) => ({
      id: s.id,
      name: s.name,
      sequence: new DNASequence(s.sequence),
    }));
    
    const tree = neighborJoining(dnaSequences, hammingDistanceDNA);
    const svg = renderTree(tree, { style: style as any });
    
    log.api(req.method, req.path, 200);
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error: any) {
    log.error(`Error in /tree/visualize: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 🧬 GENE ENDPOINTS
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/genes/find
 * Находит гены в последовательности
 * 
 * Body: { sequence: string, minLength?: number }
 */
router.post('/genes/find', (req: Request, res: Response) => {
  try {
    const { sequence, minLength = 300 } = req.body;
    
    if (!sequence) {
      return res.status(400).json({ error: 'Sequence is required' });
    }
    
    const dna = new DNASequence(sequence);
    const finder = new GeneFinder({ minGeneLength: minLength });
    const genes = finder.findGenes(dna);
    
    log.api(req.method, req.path, 200);
    
    res.json({
      geneCount: genes.length,
      genes: genes.map(g => ({
        id: g.id,
        start: g.start,
        end: g.end,
        length: g.length,
        strand: g.strand,
        gcContent: g.gcContent,
        hasPromoter: g.hasPromoter,
      })),
    });
  } catch (error: any) {
    log.error(`Error in /genes/find: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📊 STATISTICS ENDPOINTS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/stats
 * Общая статистика системы
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    log.api(req.method, req.path, 200);
    
    res.json({
      version: '12.0.0',
      modules: {
        dna: 'active',
        rna: 'active',
        tree: 'active',
        genome: 'active',
      },
      capabilities: [
        'dna-generation',
        'dna-analysis',
        'mutations',
        'transcription',
        'translation',
        'tree-building',
        'gene-finding',
      ],
    });
  } catch (error: any) {
    log.error(`Error in /stats: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default router;
