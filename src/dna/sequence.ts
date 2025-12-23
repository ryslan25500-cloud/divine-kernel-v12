/**
 * 🧬 DIVINE KERNEL V12 - DNASequence Class
 * 
 * Основной класс для работы с ДНК последовательностями.
 * Полный набор методов для манипуляции и анализа ДНК.
 */

import {
  NUCLEOTIDES,
  DNA_COMPLEMENT,
  START_CODONS,
  STOP_CODONS,
  SEQUENCE_LIMITS,
  GC_CONTENT,
} from '../core/config/constants.js';
import {
  InvalidSequenceError,
  SequenceTooLongError,
  SequenceTooShortError,
} from '../utils/errors.js';
import {
  isValidDNA,
  normalizeSequence,
  calculateGCContent,
  chunk,
  reverse,
  splitIntoCodons,
  findMotif,
} from '../utils/helpers.js';

// ═══════════════════════════════════════════════════════════
// 🧬 DNA SEQUENCE CLASS
// ═══════════════════════════════════════════════════════════

export class DNASequence {
  private _sequence: string;
  
  constructor(sequence: string) {
    this._sequence = normalizeSequence(sequence);
    this.validate();
  }
  
  // ───────────────────────────────────────────────────────────
  // 📏 BASIC PROPERTIES
  // ───────────────────────────────────────────────────────────
  
  /**
   * Возвращает последовательность
   */
  get sequence(): string {
    return this._sequence;
  }
  
  /**
   * Устанавливает последовательность
   */
  set sequence(value: string) {
    this._sequence = normalizeSequence(value);
    this.validate();
  }
  
  /**
   * Длина последовательности
   */
  get length(): number {
    return this._sequence.length;
  }
  
  /**
   * GC-content (процент G и C нуклеотидов)
   */
  get gcContent(): number {
    return calculateGCContent(this._sequence);
  }
  
  /**
   * AT-content (процент A и T нуклеотидов)
   */
  get atContent(): number {
    return 1 - this.gcContent;
  }
  
  /**
   * Подсчёт каждого нуклеотида
   */
  get nucleotideCounts(): Record<string, number> {
    const counts = { A: 0, G: 0, C: 0, T: 0 };
    
    for (const nucleotide of this._sequence) {
      counts[nucleotide as keyof typeof counts]++;
    }
    
    return counts;
  }
  
  // ───────────────────────────────────────────────────────────
  // ✅ VALIDATION
  // ───────────────────────────────────────────────────────────
  
  /**
   * Валидирует последовательность
   */
  validate(): void {
    // Проверка на допустимые символы
    if (!isValidDNA(this._sequence)) {
      throw new InvalidSequenceError(
        this._sequence,
        'Sequence contains invalid characters (only A, G, C, T allowed)'
      );
    }
    
    // Проверка минимальной длины
    if (this.length < SEQUENCE_LIMITS.MIN_LENGTH) {
      throw new SequenceTooShortError(
        this.length,
        SEQUENCE_LIMITS.MIN_LENGTH
      );
    }
    
    // Проверка максимальной длины
    if (this.length > SEQUENCE_LIMITS.MAX_LENGTH) {
      throw new SequenceTooLongError(
        this.length,
        SEQUENCE_LIMITS.MAX_LENGTH
      );
    }
  }
  
  /**
   * Проверяет биологическую реалистичность
   */
  isRealistic(): boolean {
    const gc = this.gcContent;
    return gc >= GC_CONTENT.MIN_VIABLE && gc <= GC_CONTENT.MAX_VIABLE;
  }
  
  /**
   * Проверяет оптимальность GC-content
   */
  isOptimalGC(): boolean {
    const gc = this.gcContent;
    return gc >= GC_CONTENT.OPTIMAL_MIN && gc <= GC_CONTENT.OPTIMAL_MAX;
  }
  
  // ───────────────────────────────────────────────────────────
  // 🔄 TRANSFORMATIONS
  // ───────────────────────────────────────────────────────────
  
  /**
   * Возвращает комплементарную последовательность
   */
  complement(): DNASequence {
    const complemented = this._sequence
      .split('')
      .map(n => DNA_COMPLEMENT[n as keyof typeof DNA_COMPLEMENT])
      .join('');
    
    return new DNASequence(complemented);
  }
  
  /**
   * Возвращает обратную последовательность
   */
  reverse(): DNASequence {
    return new DNASequence(reverse(this._sequence));
  }
  
  /**
   * Возвращает обратно-комплементарную последовательность
   */
  reverseComplement(): DNASequence {
    return this.complement().reverse();
  }
  
  /**
   * Извлекает подпоследовательность
   */
  slice(start: number, end?: number): DNASequence {
    return new DNASequence(this._sequence.slice(start, end));
  }
  
  /**
   * Конкатенирует с другой последовательностью
   */
  concat(other: DNASequence): DNASequence {
    return new DNASequence(this._sequence + other.sequence);
  }
  
  // ───────────────────────────────────────────────────────────
  // 🔍 ANALYSIS
  // ───────────────────────────────────────────────────────────
  
  /**
   * Разбивает на кодоны (тройки)
   */
  getCodons(frame: number = 0): string[] {
    if (frame < 0 || frame > 2) {
      throw new Error('Frame must be 0, 1, or 2');
    }
    
    const shifted = this._sequence.substring(frame);
    return splitIntoCodons(shifted);
  }
  
  /**
   * Находит все Open Reading Frames (ORF)
   */
  findORFs(minLength: number = SEQUENCE_LIMITS.MIN_ORF_LENGTH): ORF[] {
    const orfs: ORF[] = [];
    
    // Проверяем все 6 рамок считывания (3 прямые + 3 обратные)
    for (let frame = 0; frame < 3; frame++) {
      // Прямая цепь
      orfs.push(...this.findORFsInFrame(frame, '+', minLength));
      
      // Обратная цепь
      const revComp = this.reverseComplement();
      orfs.push(...revComp.findORFsInFrame(frame, '-', minLength));
    }
    
    return orfs;
  }
  
  /**
   * Находит ORF в конкретной рамке
   */
  private findORFsInFrame(
    frame: number,
    strand: '+' | '-',
    minLength: number
  ): ORF[] {
    const orfs: ORF[] = [];
    const codons = this.getCodons(frame);
    
    let inORF = false;
    let orfStart = -1;
    let orfSequence = '';
    
    for (let i = 0; i < codons.length; i++) {
      const codon = codons[i];
      
      if (codon.length < 3) continue; // Неполный кодон
      
      // Конвертируем в RNA для проверки
      const rnaCodon = codon.replace(/T/g, 'U');
      
      if (!inORF && START_CODONS.includes(rnaCodon as any)) {
        // Начало ORF
        inORF = true;
        orfStart = frame + i * 3;
        orfSequence = codon;
      } else if (inORF) {
        orfSequence += codon;
        
        if (STOP_CODONS.includes(rnaCodon as any)) {
          // Конец ORF
          const orfEnd = orfStart + orfSequence.length;
          
          if (orfSequence.length >= minLength) {
            orfs.push({
              start: orfStart,
              end: orfEnd,
              length: orfSequence.length,
              sequence: orfSequence,
              strand,
              frame,
            });
          }
          
          inORF = false;
          orfStart = -1;
          orfSequence = '';
        }
      }
    }
    
    return orfs;
  }
  
  /**
   * Находит мотив в последовательности
   */
  findMotif(motif: string): number[] {
    return findMotif(this._sequence, normalizeSequence(motif));
  }
  
  /**
   * Проверяет наличие мотива
   */
  hasMotif(motif: string): boolean {
    return this.findMotif(motif).length > 0;
  }
  
  /**
   * Вычисляет расстояние Хэмминга до другой последовательности
   */
  hammingDistance(other: DNASequence): number {
    if (this.length !== other.length) {
      throw new Error('Sequences must be of equal length');
    }
    
    let distance = 0;
    for (let i = 0; i < this.length; i++) {
      if (this._sequence[i] !== other.sequence[i]) {
        distance++;
      }
    }
    
    return distance;
  }
  
  /**
   * Вычисляет процент идентичности с другой последовательностью
   */
  identity(other: DNASequence): number {
    const distance = this.hammingDistance(other);
    return (this.length - distance) / this.length;
  }
  
  // ───────────────────────────────────────────────────────────
  // 📊 STATISTICS
  // ───────────────────────────────────────────────────────────
  
  /**
   * Возвращает статистику последовательности
   */
  getStatistics(): DNAStatistics {
    const counts = this.nucleotideCounts;
    
    return {
      length: this.length,
      gcContent: this.gcContent,
      atContent: this.atContent,
      nucleotideCounts: counts,
      isRealistic: this.isRealistic(),
      isOptimalGC: this.isOptimalGC(),
    };
  }
  
  // ───────────────────────────────────────────────────────────
  // 🎨 FORMATTING
  // ───────────────────────────────────────────────────────────
  
  /**
   * Форматирует для отображения (группы по 10)
   */
  format(chunkSize: number = 10): string {
    return chunk(this._sequence, chunkSize).join(' ');
  }
  
  /**
   * Конвертирует в строку
   */
  toString(): string {
    return this._sequence;
  }
  
  /**
   * Конвертирует в JSON
   */
  toJSON(): object {
    return {
      sequence: this._sequence,
      length: this.length,
      gcContent: this.gcContent,
      statistics: this.getStatistics(),
    };
  }
  
  /**
   * Создаёт из строки
   */
  static fromString(sequence: string): DNASequence {
    return new DNASequence(sequence);
  }
  
  /**
   * Клонирует последовательность
   */
  clone(): DNASequence {
    return new DNASequence(this._sequence);
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface ORF {
  start: number;
  end: number;
  length: number;
  sequence: string;
  strand: '+' | '-';
  frame: number;
}

export interface DNAStatistics {
  length: number;
  gcContent: number;
  atContent: number;
  nucleotideCounts: Record<string, number>;
  isRealistic: boolean;
  isOptimalGC: boolean;
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default DNASequence;
