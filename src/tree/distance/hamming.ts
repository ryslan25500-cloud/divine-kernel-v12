/**
 * 📏 DIVINE KERNEL V12 - Hamming Distance
 * 
 * Вычисление расстояния Хэмминга между последовательностями.
 * Основная метрика для сравнения ДНК/РНК одинаковой длины.
 */

import { DNASequence } from '../../dna/sequence.js';
import { RNASequence } from '../../rna/types/rna-sequence.js';
import { log } from '../../utils/logger.js';

// ═══════════════════════════════════════════════════════════
// 📏 HAMMING DISTANCE
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет расстояние Хэмминга между двумя последовательностями
 */
export function hammingDistance(seq1: string, seq2: string): number {
  if (seq1.length !== seq2.length) {
    throw new Error(
      `Sequences must be of equal length: ${seq1.length} vs ${seq2.length}`
    );
  }
  
  let distance = 0;
  
  for (let i = 0; i < seq1.length; i++) {
    if (seq1[i] !== seq2[i]) {
      distance++;
    }
  }
  
  return distance;
}

/**
 * Вычисляет расстояние Хэмминга между ДНК последовательностями
 */
export function hammingDistanceDNA(seq1: DNASequence, seq2: DNASequence): number {
  return hammingDistance(seq1.sequence, seq2.sequence);
}

/**
 * Вычисляет расстояние Хэмминга между РНК последовательностями
 */
export function hammingDistanceRNA(seq1: RNASequence, seq2: RNASequence): number {
  return hammingDistance(seq1.sequence, seq2.sequence);
}

// ═══════════════════════════════════════════════════════════
// 📊 NORMALIZED HAMMING DISTANCE
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет нормализованное расстояние Хэмминга (0-1)
 */
export function normalizedHammingDistance(seq1: string, seq2: string): number {
  if (seq1.length !== seq2.length) {
    throw new Error('Sequences must be of equal length');
  }
  
  if (seq1.length === 0) return 0;
  
  const distance = hammingDistance(seq1, seq2);
  return distance / seq1.length;
}

/**
 * Вычисляет identity (1 - normalized hamming distance)
 */
export function sequenceIdentity(seq1: string, seq2: string): number {
  return 1 - normalizedHammingDistance(seq1, seq2);
}

/**
 * Вычисляет similarity score (процент идентичности)
 */
export function similarityScore(seq1: string, seq2: string): number {
  return sequenceIdentity(seq1, seq2) * 100;
}

// ═══════════════════════════════════════════════════════════
// 🧮 WEIGHTED HAMMING DISTANCE
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет взвешенное расстояние Хэмминга
 */
export function weightedHammingDistance(
  seq1: string,
  seq2: string,
  weights: number[] | WeightMatrix
): number {
  if (seq1.length !== seq2.length) {
    throw new Error('Sequences must be of equal length');
  }
  
  let distance = 0;
  
  if (Array.isArray(weights)) {
    // Позиционные веса
    if (weights.length !== seq1.length) {
      throw new Error('Weights array must match sequence length');
    }
    
    for (let i = 0; i < seq1.length; i++) {
      if (seq1[i] !== seq2[i]) {
        distance += weights[i];
      }
    }
  } else {
    // Матрица замен
    for (let i = 0; i < seq1.length; i++) {
      const char1 = seq1[i];
      const char2 = seq2[i];
      
      if (char1 !== char2) {
        const weight = weights[char1]?.[char2] ?? 1;
        distance += weight;
      }
    }
  }
  
  return distance;
}

/**
 * Создаёт матрицу замен для нуклеотидов
 */
export function createNucleotideWeightMatrix(
  transitionWeight: number = 0.5,
  transversionWeight: number = 1.0
): WeightMatrix {
  // Transitions (A↔G, C↔T) менее вредны чем transversions
  const matrix: WeightMatrix = {
    A: { A: 0, G: transitionWeight, C: transversionWeight, T: transversionWeight },
    G: { A: transitionWeight, G: 0, C: transversionWeight, T: transversionWeight },
    C: { A: transversionWeight, G: transversionWeight, C: 0, T: transitionWeight },
    T: { A: transversionWeight, G: transversionWeight, C: transitionWeight, T: 0 },
  };
  
  return matrix;
}

// ═══════════════════════════════════════════════════════════
// 📊 HAMMING DISTANCE MATRIX
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет матрицу расстояний Хэмминга для набора последовательностей
 */
export function computeHammingMatrix(
  sequences: Array<{ id: string; sequence: string }>
): DistanceMatrix {
  const matrix: DistanceMatrix = {};
  
  for (let i = 0; i < sequences.length; i++) {
    const seq1 = sequences[i];
    matrix[seq1.id] = {};
    
    for (let j = 0; j < sequences.length; j++) {
      const seq2 = sequences[j];
      
      if (i === j) {
        matrix[seq1.id][seq2.id] = 0;
      } else {
        try {
          const distance = hammingDistance(seq1.sequence, seq2.sequence);
          matrix[seq1.id][seq2.id] = distance;
        } catch (error) {
          log.warn(`Cannot compute distance between ${seq1.id} and ${seq2.id}: ${error}`);
          matrix[seq1.id][seq2.id] = -1; // Indicate error
        }
      }
    }
  }
  
  return matrix;
}

/**
 * Вычисляет матрицу нормализованных расстояний
 */
export function computeNormalizedHammingMatrix(
  sequences: Array<{ id: string; sequence: string }>
): DistanceMatrix {
  const matrix: DistanceMatrix = {};
  
  for (let i = 0; i < sequences.length; i++) {
    const seq1 = sequences[i];
    matrix[seq1.id] = {};
    
    for (let j = 0; j < sequences.length; j++) {
      const seq2 = sequences[j];
      
      if (i === j) {
        matrix[seq1.id][seq2.id] = 0;
      } else {
        try {
          const distance = normalizedHammingDistance(seq1.sequence, seq2.sequence);
          matrix[seq1.id][seq2.id] = distance;
        } catch (error) {
          matrix[seq1.id][seq2.id] = -1;
        }
      }
    }
  }
  
  return matrix;
}

// ═══════════════════════════════════════════════════════════
// 🔍 HAMMING DISTANCE ANALYSIS
// ═══════════════════════════════════════════════════════════

/**
 * Анализирует различия между последовательностями
 */
export function analyzeDifferences(seq1: string, seq2: string): DifferenceAnalysis {
  if (seq1.length !== seq2.length) {
    throw new Error('Sequences must be of equal length');
  }
  
  const differences: Difference[] = [];
  const length = seq1.length;
  
  for (let i = 0; i < length; i++) {
    if (seq1[i] !== seq2[i]) {
      differences.push({
        position: i,
        char1: seq1[i],
        char2: seq2[i],
      });
    }
  }
  
  return {
    totalPositions: length,
    differences,
    differenceCount: differences.length,
    identity: (length - differences.length) / length,
    similarity: ((length - differences.length) / length) * 100,
  };
}

/**
 * Находит позиции различий
 */
export function findDifferencePositions(seq1: string, seq2: string): number[] {
  if (seq1.length !== seq2.length) {
    throw new Error('Sequences must be of equal length');
  }
  
  const positions: number[] = [];
  
  for (let i = 0; i < seq1.length; i++) {
    if (seq1[i] !== seq2[i]) {
      positions.push(i);
    }
  }
  
  return positions;
}

/**
 * Группирует различия по типам (для нуклеотидов)
 */
export function categorizeNucleotideDifferences(
  seq1: string,
  seq2: string
): MutationCategories {
  if (seq1.length !== seq2.length) {
    throw new Error('Sequences must be of equal length');
  }
  
  const transitions: Difference[] = []; // A↔G, C↔T
  const transversions: Difference[] = []; // Остальные
  
  const isTransition = (char1: string, char2: string): boolean => {
    return (
      (char1 === 'A' && char2 === 'G') ||
      (char1 === 'G' && char2 === 'A') ||
      (char1 === 'C' && char2 === 'T') ||
      (char1 === 'T' && char2 === 'C')
    );
  };
  
  for (let i = 0; i < seq1.length; i++) {
    if (seq1[i] !== seq2[i]) {
      const diff: Difference = {
        position: i,
        char1: seq1[i],
        char2: seq2[i],
      };
      
      if (isTransition(seq1[i], seq2[i])) {
        transitions.push(diff);
      } else {
        transversions.push(diff);
      }
    }
  }
  
  return {
    transitions,
    transversions,
    transitionCount: transitions.length,
    transversionCount: transversions.length,
    ratio: transitions.length / (transversions.length || 1), // Ts/Tv ratio
  };
}

// ═══════════════════════════════════════════════════════════
// 📈 HAMMING DISTANCE STATISTICS
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет статистику расстояний для набора последовательностей
 */
export function computeDistanceStatistics(matrix: DistanceMatrix): DistanceStatistics {
  const distances: number[] = [];
  
  // Собираем все расстояния (только верхний треугольник матрицы)
  const ids = Object.keys(matrix);
  
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const distance = matrix[ids[i]][ids[j]];
      if (distance >= 0) { // Игнорируем ошибки (-1)
        distances.push(distance);
      }
    }
  }
  
  if (distances.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
    };
  }
  
  // Сортируем для медианы
  distances.sort((a, b) => a - b);
  
  const min = distances[0];
  const max = distances[distances.length - 1];
  const sum = distances.reduce((acc, d) => acc + d, 0);
  const mean = sum / distances.length;
  
  // Медиана
  const mid = Math.floor(distances.length / 2);
  const median = distances.length % 2 === 0
    ? (distances[mid - 1] + distances[mid]) / 2
    : distances[mid];
  
  // Стандартное отклонение
  const squaredDiffs = distances.map(d => Math.pow(d - mean, 2));
  const variance = squaredDiffs.reduce((acc, d) => acc + d, 0) / distances.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    count: distances.length,
    min,
    max,
    mean,
    median,
    stdDev,
  };
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface WeightMatrix {
  [char1: string]: {
    [char2: string]: number;
  };
}

export interface DistanceMatrix {
  [id1: string]: {
    [id2: string]: number;
  };
}

export interface Difference {
  position: number;
  char1: string;
  char2: string;
}

export interface DifferenceAnalysis {
  totalPositions: number;
  differences: Difference[];
  differenceCount: number;
  identity: number;
  similarity: number;
}

export interface MutationCategories {
  transitions: Difference[];
  transversions: Difference[];
  transitionCount: number;
  transversionCount: number;
  ratio: number; // Ts/Tv ratio
}

export interface DistanceStatistics {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  hammingDistance,
  hammingDistanceDNA,
  hammingDistanceRNA,
  normalizedHammingDistance,
  sequenceIdentity,
  similarityScore,
  weightedHammingDistance,
  createNucleotideWeightMatrix,
  computeHammingMatrix,
  computeNormalizedHammingMatrix,
  analyzeDifferences,
  findDifferencePositions,
  categorizeNucleotideDifferences,
  computeDistanceStatistics,
};
