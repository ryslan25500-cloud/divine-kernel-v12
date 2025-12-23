/**
 * 🧬 DIVINE KERNEL V12 - Genetic Distance Metrics
 * 
 * Различные метрики генетического расстояния:
 * - Jukes-Cantor
 * - Kimura 2-parameter
 * - Tajima-Nei
 * - p-distance
 */

import { DNASequence } from '../../dna/sequence.js';
import { hammingDistance, categorizeNucleotideDifferences } from './hamming.js';
import { log } from '../../utils/logger.js';

// ═══════════════════════════════════════════════════════════
// 📏 P-DISTANCE
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет p-distance (пропорция различающихся сайтов)
 */
export function pDistance(seq1: DNASequence, seq2: DNASequence): number {
  const hamming = hammingDistance(seq1.sequence, seq2.sequence);
  return hamming / seq1.length;
}

// ═══════════════════════════════════════════════════════════
// 🔬 JUKES-CANTOR DISTANCE
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет расстояние Jukes-Cantor (учитывает множественные замены)
 */
export function jukesCantor(seq1: DNASequence, seq2: DNASequence): number {
  const p = pDistance(seq1, seq2);
  
  // Проверяем что p < 0.75 (иначе формула неопределена)
  if (p >= 0.75) {
    log.warn(`p-distance ${p.toFixed(3)} >= 0.75, JC distance may be inaccurate`);
    return Infinity;
  }
  
  // JC distance = -3/4 * ln(1 - 4p/3)
  const distance = (-3 / 4) * Math.log(1 - (4 * p) / 3);
  
  return distance;
}

/**
 * Вычисляет матрицу расстояний Jukes-Cantor
 */
export function jukesCanorMatrix(
  sequences: Array<{ id: string; sequence: DNASequence }>
): DistanceMatrix {
  const matrix: DistanceMatrix = {};
  
  for (const seq1 of sequences) {
    matrix[seq1.id] = {};
    
    for (const seq2 of sequences) {
      if (seq1.id === seq2.id) {
        matrix[seq1.id][seq2.id] = 0;
      } else {
        matrix[seq1.id][seq2.id] = jukesCantor(seq1.sequence, seq2.sequence);
      }
    }
  }
  
  return matrix;
}

// ═══════════════════════════════════════════════════════════
// 🔬 KIMURA 2-PARAMETER DISTANCE
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет расстояние Kimura 2-parameter (различает transitions/transversions)
 */
export function kimura2Parameter(seq1: DNASequence, seq2: DNASequence): number {
  const categories = categorizeNucleotideDifferences(seq1.sequence, seq2.sequence);
  
  const length = seq1.length;
  const P = categories.transitionCount / length; // Transitions
  const Q = categories.transversionCount / length; // Transversions
  
  // Проверяем условия применимости
  if (1 - 2 * P - Q <= 0 || 1 - 2 * Q <= 0) {
    log.warn('K2P conditions not met, distance may be inaccurate');
    return Infinity;
  }
  
  // K2P distance = -1/2 * ln((1-2P-Q) * sqrt(1-2Q))
  const term1 = 1 - 2 * P - Q;
  const term2 = Math.sqrt(1 - 2 * Q);
  
  const distance = (-1 / 2) * Math.log(term1 * term2);
  
  return distance;
}

/**
 * Вычисляет матрицу Kimura 2-parameter
 */
export function kimura2ParameterMatrix(
  sequences: Array<{ id: string; sequence: DNASequence }>
): DistanceMatrix {
  const matrix: DistanceMatrix = {};
  
  for (const seq1 of sequences) {
    matrix[seq1.id] = {};
    
    for (const seq2 of sequences) {
      if (seq1.id === seq2.id) {
        matrix[seq1.id][seq2.id] = 0;
      } else {
        matrix[seq1.id][seq2.id] = kimura2Parameter(seq1.sequence, seq2.sequence);
      }
    }
  }
  
  return matrix;
}

// ═══════════════════════════════════════════════════════════
// 🔬 TAJIMA-NEI DISTANCE
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет расстояние Tajima-Nei (учитывает неравные частоты нуклеотидов)
 */
export function tajimaNei(seq1: DNASequence, seq2: DNASequence): number {
  // Вычисляем частоты нуклеотидов
  const freq1 = getNucleotideFrequencies(seq1);
  const freq2 = getNucleotideFrequencies(seq2);
  
  // Средние частоты
  const avgFreq = {
    A: (freq1.A + freq2.A) / 2,
    G: (freq1.G + freq2.G) / 2,
    C: (freq1.C + freq2.C) / 2,
    T: (freq1.T + freq2.T) / 2,
  };
  
  // Вычисляем b (коэффициент)
  const b = 0.5 * (
    1 - Math.pow(avgFreq.A, 2) - Math.pow(avgFreq.G, 2) -
    Math.pow(avgFreq.C, 2) - Math.pow(avgFreq.T, 2)
  );
  
  // p-distance
  const p = pDistance(seq1, seq2);
  
  // TN distance = -b * ln(1 - p/b)
  if (p >= b) {
    log.warn('TN conditions not met, distance may be inaccurate');
    return Infinity;
  }
  
  const distance = -b * Math.log(1 - p / b);
  
  return distance;
}

/**
 * Получает частоты нуклеотидов
 */
function getNucleotideFrequencies(seq: DNASequence): NucleotideFrequencies {
  const counts = seq.nucleotideCounts;
  const total = seq.length;
  
  return {
    A: counts.A / total,
    G: counts.G / total,
    C: counts.C / total,
    T: counts.T / total,
  };
}

// ═══════════════════════════════════════════════════════════
// 🔬 F84 DISTANCE
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет расстояние F84 (Felsenstein 1984)
 */
export function f84Distance(seq1: DNASequence, seq2: DNASequence): number {
  const freq1 = getNucleotideFrequencies(seq1);
  const freq2 = getNucleotideFrequencies(seq2);
  
  // Средние частоты
  const avgFreq = {
    A: (freq1.A + freq2.A) / 2,
    G: (freq1.G + freq2.G) / 2,
    C: (freq1.C + freq2.C) / 2,
    T: (freq1.T + freq2.T) / 2,
  };
  
  // Частоты пуринов и пиримидинов
  const fR = avgFreq.A + avgFreq.G; // Purines
  const fY = avgFreq.C + avgFreq.T; // Pyrimidines
  
  // p-distance
  const p = pDistance(seq1, seq2);
  
  // Категоризация мутаций
  const categories = categorizeNucleotideDifferences(seq1.sequence, seq2.sequence);
  const P = categories.transitionCount / seq1.length;
  const Q = categories.transversionCount / seq1.length;
  
  // Коэффициенты
  const a = 1 / (2 * fR * fY);
  const b = 1 / (2 * (fR * fY + (fR * fR * avgFreq.A * avgFreq.G) + (fY * fY * avgFreq.C * avgFreq.T)));
  
  // F84 distance
  const term1 = 1 - p / (2 * fR * fY);
  const term2 = 1 - 2 * Q;
  
  if (term1 <= 0 || term2 <= 0) {
    return Infinity;
  }
  
  const distance = -2 * a * Math.log(term1) - 2 * (b - a) * Math.log(term2);
  
  return distance;
}

// ═══════════════════════════════════════════════════════════
// 📊 DISTANCE COMPARISON
// ═══════════════════════════════════════════════════════════

/**
 * Сравнивает различные метрики расстояний
 */
export function compareDistanceMetrics(
  seq1: DNASequence,
  seq2: DNASequence
): DistanceComparison {
  return {
    pDistance: pDistance(seq1, seq2),
    jukesCantor: jukesCantor(seq1, seq2),
    kimura2Parameter: kimura2Parameter(seq1, seq2),
    tajimaNei: tajimaNei(seq1, seq2),
    f84: f84Distance(seq1, seq2),
  };
}

/**
 * Выбирает оптимальную метрику на основе свойств последовательностей
 */
export function selectOptimalMetric(
  sequences: Array<{ id: string; sequence: DNASequence }>
): DistanceMetric {
  // Анализируем последовательности
  let maxPDistance = 0;
  let hasUnequalFrequencies = false;
  
  // Проверяем пары последовательностей
  for (let i = 0; i < sequences.length; i++) {
    for (let j = i + 1; j < sequences.length; j++) {
      const p = pDistance(sequences[i].sequence, sequences[j].sequence);
      maxPDistance = Math.max(maxPDistance, p);
      
      // Проверяем равномерность частот нуклеотидов
      const freq = getNucleotideFrequencies(sequences[i].sequence);
      const deviation = Math.abs(freq.A - 0.25) + Math.abs(freq.G - 0.25) +
                       Math.abs(freq.C - 0.25) + Math.abs(freq.T - 0.25);
      
      if (deviation > 0.1) {
        hasUnequalFrequencies = true;
      }
    }
  }
  
  // Выбираем метрику
  if (maxPDistance < 0.1) {
    // Малые расстояния - p-distance достаточно
    return 'p-distance';
  } else if (hasUnequalFrequencies) {
    // Неравномерные частоты - Tajima-Nei или F84
    return 'tajima-nei';
  } else {
    // Стандартный случай - Kimura 2-parameter
    return 'kimura-2-parameter';
  }
}

/**
 * Вычисляет матрицу расстояний используя выбранную метрику
 */
export function computeDistanceMatrix(
  sequences: Array<{ id: string; sequence: DNASequence }>,
  metric: DistanceMetric = 'kimura-2-parameter'
): DistanceMatrix {
  log.info(`Computing distance matrix using ${metric}`);
  
  const distanceFunction = getDistanceFunction(metric);
  const matrix: DistanceMatrix = {};
  
  for (const seq1 of sequences) {
    matrix[seq1.id] = {};
    
    for (const seq2 of sequences) {
      if (seq1.id === seq2.id) {
        matrix[seq1.id][seq2.id] = 0;
      } else {
        try {
          matrix[seq1.id][seq2.id] = distanceFunction(seq1.sequence, seq2.sequence);
        } catch (error) {
          log.warn(`Error computing distance between ${seq1.id} and ${seq2.id}: ${error}`);
          matrix[seq1.id][seq2.id] = Infinity;
        }
      }
    }
  }
  
  return matrix;
}

/**
 * Получает функцию расстояния по имени метрики
 */
function getDistanceFunction(metric: DistanceMetric): DistanceFunction {
  const functions: Record<DistanceMetric, DistanceFunction> = {
    'p-distance': pDistance,
    'jukes-cantor': jukesCantor,
    'kimura-2-parameter': kimura2Parameter,
    'tajima-nei': tajimaNei,
    'f84': f84Distance,
  };
  
  return functions[metric];
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface DistanceMatrix {
  [id1: string]: {
    [id2: string]: number;
  };
}

export interface NucleotideFrequencies {
  A: number;
  G: number;
  C: number;
  T: number;
}

export interface DistanceComparison {
  pDistance: number;
  jukesCantor: number;
  kimura2Parameter: number;
  tajimaNei: number;
  f84: number;
}

export type DistanceMetric =
  | 'p-distance'
  | 'jukes-cantor'
  | 'kimura-2-parameter'
  | 'tajima-nei'
  | 'f84';

export type DistanceFunction = (seq1: DNASequence, seq2: DNASequence) => number;

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  pDistance,
  jukesCantor,
  kimura2Parameter,
  tajimaNei,
  f84Distance,
  compareDistanceMetrics,
  selectOptimalMetric,
  computeDistanceMatrix,
  jukesCanorMatrix,
  kimura2ParameterMatrix,
};
