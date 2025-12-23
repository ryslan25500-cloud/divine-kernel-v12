/**
 * 📄 DIVINE KERNEL V12 - FASTA Parser
 * 
 * Парсинг FASTA формата - стандартного формата для последовательностей.
 * Поддержка больших файлов и streaming.
 */

import { DNASequence } from '../../../dna/sequence.js';
import { RNASequence } from '../../../rna/types/rna-sequence.js';
import { log } from '../../../utils/logger.js';
import { readFileSync, createReadStream } from 'fs';
import { createInterface } from 'readline';

// ═══════════════════════════════════════════════════════════
// 📄 FASTA RECORD
// ═══════════════════════════════════════════════════════════

export class FastaRecord {
  id: string;
  description: string;
  sequence: string;
  
  constructor(id: string, description: string, sequence: string) {
    this.id = id;
    this.description = description;
    this.sequence = sequence.toUpperCase().replace(/\s/g, '');
  }
  
  /**
   * Возвращает полный header (>id description)
   */
  get header(): string {
    return this.description ? `${this.id} ${this.description}` : this.id;
  }
  
  /**
   * Конвертирует в DNASequence
   */
  toDNA(): DNASequence {
    return new DNASequence(this.sequence);
  }
  
  /**
   * Конвертирует в RNASequence
   */
  toRNA(): RNASequence {
    return new RNASequence(this.sequence.replace(/T/g, 'U'));
  }
  
  /**
   * Форматирует в FASTA строку
   */
  toString(lineWidth: number = 80): string {
    const lines = [`>${this.header}`];
    
    // Разбиваем последовательность на строки заданной длины
    for (let i = 0; i < this.sequence.length; i += lineWidth) {
      lines.push(this.sequence.substring(i, i + lineWidth));
    }
    
    return lines.join('\n');
  }
}

// ═══════════════════════════════════════════════════════════
// 📥 FASTA PARSING
// ═══════════════════════════════════════════════════════════

/**
 * Парсит FASTA файл (синхронно)
 */
export function parseFasta(content: string): FastaRecord[] {
  const records: FastaRecord[] = [];
  const lines = content.split('\n');
  
  let currentId = '';
  let currentDescription = '';
  let currentSequence = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue; // Пропускаем пустые строки
    
    if (trimmed.startsWith('>')) {
      // Новый header
      if (currentId) {
        // Сохраняем предыдущий record
        records.push(new FastaRecord(currentId, currentDescription, currentSequence));
      }
      
      // Парсим header
      const header = trimmed.substring(1).trim();
      const spaceIndex = header.indexOf(' ');
      
      if (spaceIndex !== -1) {
        currentId = header.substring(0, spaceIndex);
        currentDescription = header.substring(spaceIndex + 1).trim();
      } else {
        currentId = header;
        currentDescription = '';
      }
      
      currentSequence = '';
    } else {
      // Последовательность
      currentSequence += trimmed;
    }
  }
  
  // Добавляем последний record
  if (currentId) {
    records.push(new FastaRecord(currentId, currentDescription, currentSequence));
  }
  
  log.info(`Parsed ${records.length} FASTA records`);
  
  return records;
}

/**
 * Парсит FASTA файл из пути
 */
export function parseFastaFile(filepath: string): FastaRecord[] {
  const content = readFileSync(filepath, 'utf-8');
  return parseFasta(content);
}

/**
 * Парсит FASTA файл асинхронно (streaming)
 */
export async function parseFastaStream(
  filepath: string,
  callback: (record: FastaRecord) => void | Promise<void>
): Promise<void> {
  const fileStream = createReadStream(filepath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  
  let currentId = '';
  let currentDescription = '';
  let currentSequence = '';
  let recordCount = 0;
  
  for await (const line of rl) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    if (trimmed.startsWith('>')) {
      // Новый header
      if (currentId) {
        // Обрабатываем предыдущий record
        const record = new FastaRecord(currentId, currentDescription, currentSequence);
        await callback(record);
        recordCount++;
      }
      
      // Парсим новый header
      const header = trimmed.substring(1).trim();
      const spaceIndex = header.indexOf(' ');
      
      if (spaceIndex !== -1) {
        currentId = header.substring(0, spaceIndex);
        currentDescription = header.substring(spaceIndex + 1).trim();
      } else {
        currentId = header;
        currentDescription = '';
      }
      
      currentSequence = '';
    } else {
      currentSequence += trimmed;
    }
  }
  
  // Обрабатываем последний record
  if (currentId) {
    const record = new FastaRecord(currentId, currentDescription, currentSequence);
    await callback(record);
    recordCount++;
  }
  
  log.info(`Streamed ${recordCount} FASTA records`);
}

// ═══════════════════════════════════════════════════════════
// 📤 FASTA WRITING
// ═══════════════════════════════════════════════════════════

/**
 * Конвертирует records в FASTA строку
 */
export function toFasta(records: FastaRecord[], lineWidth: number = 80): string {
  return records.map(r => r.toString(lineWidth)).join('\n\n');
}

/**
 * Создаёт FASTA record из DNASequence
 */
export function fromDNASequence(id: string, sequence: DNASequence, description?: string): FastaRecord {
  return new FastaRecord(id, description || '', sequence.sequence);
}

/**
 * Создаёт FASTA record из RNASequence
 */
export function fromRNASequence(id: string, sequence: RNASequence, description?: string): FastaRecord {
  return new FastaRecord(id, description || '', sequence.sequence);
}

// ═══════════════════════════════════════════════════════════
// 🔍 FASTA UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Извлекает конкретный record по ID
 */
export function findRecordById(records: FastaRecord[], id: string): FastaRecord | undefined {
  return records.find(r => r.id === id);
}

/**
 * Фильтрует records по длине последовательности
 */
export function filterByLength(
  records: FastaRecord[],
  minLength: number,
  maxLength?: number
): FastaRecord[] {
  return records.filter(r => {
    const len = r.sequence.length;
    return len >= minLength && (maxLength === undefined || len <= maxLength);
  });
}

/**
 * Фильтрует records по паттерну в описании
 */
export function filterByDescription(records: FastaRecord[], pattern: string | RegExp): FastaRecord[] {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  return records.filter(r => regex.test(r.description));
}

/**
 * Вычисляет статистику FASTA файла
 */
export function computeStatistics(records: FastaRecord[]): FastaStatistics {
  if (records.length === 0) {
    return {
      count: 0,
      totalLength: 0,
      minLength: 0,
      maxLength: 0,
      avgLength: 0,
      medianLength: 0,
    };
  }
  
  const lengths = records.map(r => r.sequence.length);
  lengths.sort((a, b) => a - b);
  
  const totalLength = lengths.reduce((sum, len) => sum + len, 0);
  const avgLength = totalLength / lengths.length;
  
  const mid = Math.floor(lengths.length / 2);
  const medianLength = lengths.length % 2 === 0
    ? (lengths[mid - 1] + lengths[mid]) / 2
    : lengths[mid];
  
  return {
    count: records.length,
    totalLength,
    minLength: lengths[0],
    maxLength: lengths[lengths.length - 1],
    avgLength,
    medianLength,
  };
}

/**
 * Валидирует FASTA record
 */
export function validateRecord(record: FastaRecord): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Проверка ID
  if (!record.id) {
    errors.push('Record has no ID');
  }
  
  if (record.id.includes(' ')) {
    warnings.push('Record ID contains spaces');
  }
  
  // Проверка последовательности
  if (!record.sequence) {
    errors.push('Record has no sequence');
  }
  
  if (record.sequence.length === 0) {
    errors.push('Record has empty sequence');
  }
  
  // Проверка на недопустимые символы
  const validChars = /^[ACGTUNRYWSMKBDHV\-]+$/i;
  if (!validChars.test(record.sequence)) {
    warnings.push('Sequence contains unusual characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Разбивает большой FASTA файл на chunks
 */
export function chunkRecords(records: FastaRecord[], chunkSize: number): FastaRecord[][] {
  const chunks: FastaRecord[][] = [];
  
  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(records.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Объединяет несколько FASTA файлов
 */
export function mergeFastaFiles(filepaths: string[]): FastaRecord[] {
  const allRecords: FastaRecord[] = [];
  
  for (const filepath of filepaths) {
    const records = parseFastaFile(filepath);
    allRecords.push(...records);
  }
  
  log.info(`Merged ${filepaths.length} FASTA files: ${allRecords.length} total records`);
  
  return allRecords;
}

/**
 * Дедуплицирует records по последовательности
 */
export function deduplicateRecords(records: FastaRecord[]): FastaRecord[] {
  const seen = new Set<string>();
  const unique: FastaRecord[] = [];
  
  for (const record of records) {
    if (!seen.has(record.sequence)) {
      seen.add(record.sequence);
      unique.push(record);
    }
  }
  
  log.info(`Deduplicated: ${records.length} → ${unique.length} records`);
  
  return unique;
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface FastaStatistics {
  count: number;
  totalLength: number;
  minLength: number;
  maxLength: number;
  avgLength: number;
  medianLength: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  FastaRecord,
  parseFasta,
  parseFastaFile,
  parseFastaStream,
  toFasta,
  fromDNASequence,
  fromRNASequence,
  findRecordById,
  filterByLength,
  filterByDescription,
  computeStatistics,
  validateRecord,
  chunkRecords,
  mergeFastaFiles,
  deduplicateRecords,
};
