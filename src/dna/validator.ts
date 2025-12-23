/**
 * ✅ DIVINE KERNEL V12 - DNA Validator
 * 
 * Расширенная валидация ДНК последовательностей.
 * Проверка биологической реалистичности, поиск проблем.
 */

import { DNASequence } from './sequence.js';
import { GC_CONTENT, SEQUENCE_LIMITS, MOTIFS } from '../core/config/constants.js';
import { countOccurrences, findMotif } from '../utils/helpers.js';

// ═══════════════════════════════════════════════════════════
// ✅ VALIDATION RESULT
// ═══════════════════════════════════════════════════════════

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  statistics: ValidationStatistics;
}

export interface ValidationError {
  type: string;
  message: string;
  position?: number;
}

export interface ValidationWarning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationStatistics {
  length: number;
  gcContent: number;
  homopolymerRuns: number;
  repetitiveContent: number;
  complexity: number;
}

// ═══════════════════════════════════════════════════════════
// 🔍 MAIN VALIDATOR
// ═══════════════════════════════════════════════════════════

/**
 * Полная валидация последовательности
 */
export function validate(
  sequence: DNASequence,
  options: ValidationOptions = {}
): ValidationResult {
  const {
    checkGCContent = true,
    checkComplexity = true,
    checkHomopolymers = true,
    checkRepetitiveElements = true,
    strictMode = false,
  } = options;
  
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Базовая валидация
  try {
    sequence.validate();
  } catch (error: any) {
    errors.push({
      type: 'INVALID_SEQUENCE',
      message: error.message,
    });
    
    // Если базовая валидация не прошла, возвращаем сразу
    return {
      isValid: false,
      errors,
      warnings,
      statistics: getStatistics(sequence),
    };
  }
  
  // GC-content проверка
  if (checkGCContent) {
    const gcResult = validateGCContent(sequence, strictMode);
    errors.push(...gcResult.errors);
    warnings.push(...gcResult.warnings);
  }
  
  // Сложность последовательности
  if (checkComplexity) {
    const complexityResult = validateComplexity(sequence, strictMode);
    errors.push(...complexityResult.errors);
    warnings.push(...complexityResult.warnings);
  }
  
  // Гомополимерные участки
  if (checkHomopolymers) {
    const homopolymerResult = validateHomopolymers(sequence, strictMode);
    warnings.push(...homopolymerResult.warnings);
  }
  
  // Повторяющиеся элементы
  if (checkRepetitiveElements) {
    const repetitiveResult = validateRepetitiveElements(sequence, strictMode);
    warnings.push(...repetitiveResult.warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics: getStatistics(sequence),
  };
}

// ═══════════════════════════════════════════════════════════
// 📊 GC-CONTENT VALIDATION
// ═══════════════════════════════════════════════════════════

function validateGCContent(
  sequence: DNASequence,
  strict: boolean
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const gc = sequence.gcContent;
  
  // Критичная проверка
  if (gc < GC_CONTENT.MIN_VIABLE || gc > GC_CONTENT.MAX_VIABLE) {
    errors.push({
      type: 'GC_CONTENT_OUT_OF_RANGE',
      message: `GC-content ${(gc * 100).toFixed(1)}% is outside viable range (${GC_CONTENT.MIN_VIABLE * 100}%-${GC_CONTENT.MAX_VIABLE * 100}%)`,
    });
  }
  
  // Предупреждения
  if (strict) {
    if (gc < GC_CONTENT.OPTIMAL_MIN || gc > GC_CONTENT.OPTIMAL_MAX) {
      warnings.push({
        type: 'GC_CONTENT_SUBOPTIMAL',
        message: `GC-content ${(gc * 100).toFixed(1)}% is outside optimal range (${GC_CONTENT.OPTIMAL_MIN * 100}%-${GC_CONTENT.OPTIMAL_MAX * 100}%)`,
        severity: 'medium',
      });
    }
  }
  
  // Проверка локальных вариаций GC-content
  const localGC = calculateLocalGCContent(sequence, 100);
  const gcVariation = Math.max(...localGC) - Math.min(...localGC);
  
  if (gcVariation > 0.3) {
    warnings.push({
      type: 'HIGH_GC_VARIATION',
      message: `High GC-content variation detected (${(gcVariation * 100).toFixed(1)}%)`,
      severity: 'low',
    });
  }
  
  return { errors, warnings };
}

/**
 * Вычисляет локальный GC-content в окнах
 */
function calculateLocalGCContent(sequence: DNASequence, windowSize: number): number[] {
  const localGC: number[] = [];
  const seq = sequence.sequence;
  
  for (let i = 0; i <= seq.length - windowSize; i += windowSize / 2) {
    const window = seq.substring(i, i + windowSize);
    const gc = (countOccurrences(window, 'G') + countOccurrences(window, 'C')) / window.length;
    localGC.push(gc);
  }
  
  return localGC;
}

// ═══════════════════════════════════════════════════════════
// 🧮 COMPLEXITY VALIDATION
// ═══════════════════════════════════════════════════════════

function validateComplexity(
  sequence: DNASequence,
  strict: boolean
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const complexity = calculateComplexity(sequence);
  
  if (complexity < 0.3) {
    if (strict) {
      errors.push({
        type: 'LOW_COMPLEXITY',
        message: `Sequence has very low complexity (${complexity.toFixed(2)})`,
      });
    } else {
      warnings.push({
        type: 'LOW_COMPLEXITY',
        message: `Sequence has low complexity (${complexity.toFixed(2)})`,
        severity: 'high',
      });
    }
  } else if (complexity < 0.5) {
    warnings.push({
      type: 'MODERATE_COMPLEXITY',
      message: `Sequence has moderate complexity (${complexity.toFixed(2)})`,
      severity: 'medium',
    });
  }
  
  return { errors, warnings };
}

/**
 * Вычисляет сложность последовательности (Shannon entropy)
 */
function calculateComplexity(sequence: DNASequence): number {
  const counts = sequence.nucleotideCounts;
  const total = sequence.length;
  
  let entropy = 0;
  for (const count of Object.values(counts)) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }
  
  // Нормализуем к [0, 1]
  const maxEntropy = Math.log2(4); // 4 нуклеотида
  return entropy / maxEntropy;
}

// ═══════════════════════════════════════════════════════════
// 🔁 HOMOPOLYMER VALIDATION
// ═══════════════════════════════════════════════════════════

function validateHomopolymers(
  sequence: DNASequence,
  strict: boolean
): { warnings: ValidationWarning[] } {
  const warnings: ValidationWarning[] = [];
  
  const homopolymers = findHomopolymers(sequence, 6);
  
  if (homopolymers.length > 0) {
    const maxLength = Math.max(...homopolymers.map(h => h.length));
    
    if (maxLength >= 10) {
      warnings.push({
        type: 'LONG_HOMOPOLYMER',
        message: `Found ${homopolymers.length} homopolymer runs, longest is ${maxLength}bp`,
        severity: 'high',
      });
    } else if (maxLength >= 6) {
      warnings.push({
        type: 'MODERATE_HOMOPOLYMER',
        message: `Found ${homopolymers.length} homopolymer runs (max ${maxLength}bp)`,
        severity: 'medium',
      });
    }
  }
  
  return { warnings };
}

/**
 * Находит гомополимерные участки
 */
function findHomopolymers(
  sequence: DNASequence,
  minLength: number
): Array<{ nucleotide: string; position: number; length: number }> {
  const homopolymers: Array<{ nucleotide: string; position: number; length: number }> = [];
  const seq = sequence.sequence;
  
  let currentNucleotide = seq[0];
  let currentStart = 0;
  let currentLength = 1;
  
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] === currentNucleotide) {
      currentLength++;
    } else {
      if (currentLength >= minLength) {
        homopolymers.push({
          nucleotide: currentNucleotide,
          position: currentStart,
          length: currentLength,
        });
      }
      
      currentNucleotide = seq[i];
      currentStart = i;
      currentLength = 1;
    }
  }
  
  // Проверяем последний участок
  if (currentLength >= minLength) {
    homopolymers.push({
      nucleotide: currentNucleotide,
      position: currentStart,
      length: currentLength,
    });
  }
  
  return homopolymers;
}

// ═══════════════════════════════════════════════════════════
// 🔄 REPETITIVE ELEMENTS VALIDATION
// ═══════════════════════════════════════════════════════════

function validateRepetitiveElements(
  sequence: DNASequence,
  strict: boolean
): { warnings: ValidationWarning[] } {
  const warnings: ValidationWarning[] = [];
  
  const repetitiveContent = calculateRepetitiveContent(sequence);
  
  if (repetitiveContent > 0.5) {
    warnings.push({
      type: 'HIGH_REPETITIVE_CONTENT',
      message: `High repetitive content detected (${(repetitiveContent * 100).toFixed(1)}%)`,
      severity: 'high',
    });
  } else if (repetitiveContent > 0.3) {
    warnings.push({
      type: 'MODERATE_REPETITIVE_CONTENT',
      message: `Moderate repetitive content (${(repetitiveContent * 100).toFixed(1)}%)`,
      severity: 'medium',
    });
  }
  
  return { warnings };
}

/**
 * Вычисляет процент повторяющихся элементов
 */
function calculateRepetitiveContent(sequence: DNASequence): number {
  const seq = sequence.sequence;
  const kmerSize = 10;
  const kmers = new Map<string, number>();
  
  // Подсчитываем k-меры
  for (let i = 0; i <= seq.length - kmerSize; i++) {
    const kmer = seq.substring(i, i + kmerSize);
    kmers.set(kmer, (kmers.get(kmer) || 0) + 1);
  }
  
  // Считаем повторяющиеся k-меры
  let repetitiveBases = 0;
  for (const [kmer, count] of kmers.entries()) {
    if (count > 1) {
      repetitiveBases += kmer.length * count;
    }
  }
  
  return repetitiveBases / seq.length;
}

// ═══════════════════════════════════════════════════════════
// 📊 STATISTICS
// ═══════════════════════════════════════════════════════════

function getStatistics(sequence: DNASequence): ValidationStatistics {
  return {
    length: sequence.length,
    gcContent: sequence.gcContent,
    homopolymerRuns: findHomopolymers(sequence, 6).length,
    repetitiveContent: calculateRepetitiveContent(sequence),
    complexity: calculateComplexity(sequence),
  };
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface ValidationOptions {
  checkGCContent?: boolean;
  checkComplexity?: boolean;
  checkHomopolymers?: boolean;
  checkRepetitiveElements?: boolean;
  strictMode?: boolean;
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  validate,
  validateGCContent,
  validateComplexity,
  validateHomopolymers,
  validateRepetitiveElements,
  calculateComplexity,
  findHomopolymers,
  calculateRepetitiveContent,
};
