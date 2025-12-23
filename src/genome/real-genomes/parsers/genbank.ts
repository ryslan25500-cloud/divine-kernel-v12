/**
 * 🧬 DIVINE KERNEL V12 - GenBank Parser
 * 
 * Парсинг GenBank формата - богатый аннотированный формат.
 * Содержит features, references, и другие метаданные.
 */

import { DNASequence } from '../../../dna/sequence.js';
import { log } from '../../../utils/logger.js';
import { readFileSync } from 'fs';

// ═══════════════════════════════════════════════════════════
// 🧬 GENBANK RECORD
// ═══════════════════════════════════════════════════════════

export class GenBankRecord {
  locus: LocusInfo;
  definition: string;
  accession: string;
  version: string;
  keywords: string[];
  source: SourceInfo;
  references: Reference[];
  features: Feature[];
  origin: string;
  
  constructor() {
    this.locus = { name: '', length: 0, moleculeType: '', topology: 'linear', division: '', date: '' };
    this.definition = '';
    this.accession = '';
    this.version = '';
    this.keywords = [];
    this.source = { organism: '', taxonomy: [] };
    this.references = [];
    this.features = [];
    this.origin = '';
  }
  
  /**
   * Конвертирует origin в DNASequence
   */
  toDNA(): DNASequence {
    // Удаляем пробелы и цифры из origin
    const cleanSequence = this.origin.replace(/[\s\d]/g, '');
    return new DNASequence(cleanSequence);
  }
  
  /**
   * Получает все features определённого типа
   */
  getFeaturesByType(type: string): Feature[] {
    return this.features.filter(f => f.type === type);
  }
  
  /**
   * Получает все CDS (coding sequences)
   */
  getCDS(): Feature[] {
    return this.getFeaturesByType('CDS');
  }
  
  /**
   * Получает все гены
   */
  getGenes(): Feature[] {
    return this.getFeaturesByType('gene');
  }
}

// ═══════════════════════════════════════════════════════════
// 📥 GENBANK PARSING
// ═══════════════════════════════════════════════════════════

/**
 * Парсит GenBank файл
 */
export function parseGenBank(content: string): GenBankRecord[] {
  const records: GenBankRecord[] = [];
  
  // Разбиваем на отдельные записи (по "//")
  const recordTexts = content.split(/^\/\/$/m);
  
  for (const recordText of recordTexts) {
    if (!recordText.trim()) continue;
    
    const record = parseGenBankRecord(recordText);
    if (record) {
      records.push(record);
    }
  }
  
  log.info(`Parsed ${records.length} GenBank records`);
  
  return records;
}

/**
 * Парсит одну GenBank запись
 */
function parseGenBankRecord(text: string): GenBankRecord | null {
  const record = new GenBankRecord();
  const lines = text.split('\n');
  
  let currentSection = '';
  let featureText = '';
  let originText = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Определяем секцию
    if (line.startsWith('LOCUS')) {
      currentSection = 'LOCUS';
      parseLocus(line, record);
    } else if (line.startsWith('DEFINITION')) {
      currentSection = 'DEFINITION';
      record.definition = line.substring(12).trim();
    } else if (line.startsWith('ACCESSION')) {
      record.accession = line.substring(12).trim();
    } else if (line.startsWith('VERSION')) {
      record.version = line.substring(12).trim();
    } else if (line.startsWith('KEYWORDS')) {
      const keywords = line.substring(12).trim();
      record.keywords = keywords.split(/[;,]/).map(k => k.trim()).filter(k => k && k !== '.');
    } else if (line.startsWith('SOURCE')) {
      currentSection = 'SOURCE';
      record.source.organism = line.substring(12).trim();
    } else if (line.startsWith('  ORGANISM')) {
      const organism = line.substring(12).trim();
      // Следующие строки содержат таксономию
      let j = i + 1;
      let taxonomy = '';
      while (j < lines.length && lines[j].startsWith('            ')) {
        taxonomy += lines[j].trim() + ' ';
        j++;
      }
      record.source.taxonomy = taxonomy.trim().split(/[;.]/).map(t => t.trim()).filter(t => t);
    } else if (line.startsWith('REFERENCE')) {
      currentSection = 'REFERENCE';
      // TODO: Parse reference details
    } else if (line.startsWith('FEATURES')) {
      currentSection = 'FEATURES';
    } else if (line.startsWith('ORIGIN')) {
      currentSection = 'ORIGIN';
    } else if (currentSection === 'DEFINITION' && line.startsWith('            ')) {
      // Продолжение definition
      record.definition += ' ' + line.trim();
    } else if (currentSection === 'FEATURES' && line.trim()) {
      featureText += line + '\n';
    } else if (currentSection === 'ORIGIN') {
      originText += line;
    }
  }
  
  // Парсим features
  if (featureText) {
    record.features = parseFeatures(featureText);
  }
  
  // Парсим origin
  if (originText) {
    record.origin = parseOrigin(originText);
  }
  
  return record;
}

/**
 * Парсит LOCUS строку
 */
function parseLocus(line: string, record: GenBankRecord): void {
  // LOCUS       SCU49845     5028 bp    DNA     linear   PLN 21-JUN-1999
  const parts = line.split(/\s+/).filter(p => p);
  
  if (parts.length >= 2) record.locus.name = parts[1];
  if (parts.length >= 3) record.locus.length = parseInt(parts[2]) || 0;
  if (parts.length >= 5) record.locus.moleculeType = parts[4];
  if (parts.length >= 6) record.locus.topology = parts[5];
  if (parts.length >= 7) record.locus.division = parts[6];
  if (parts.length >= 8) record.locus.date = parts[7];
}

/**
 * Парсит FEATURES секцию
 */
function parseFeatures(text: string): Feature[] {
  const features: Feature[] = [];
  const lines = text.split('\n');
  
  let currentFeature: Feature | null = null;
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Новый feature начинается с 5 пробелами и названием типа
    if (line.match(/^\s{5}[a-zA-Z_]+/)) {
      // Сохраняем предыдущий feature
      if (currentFeature) {
        features.push(currentFeature);
      }
      
      // Новый feature
      const match = line.match(/^\s{5}([a-zA-Z_]+)\s+(.+)/);
      if (match) {
        currentFeature = {
          type: match[1],
          location: match[2].trim(),
          qualifiers: {},
        };
      }
    } else if (currentFeature && line.match(/^\s{21}\//)) {
      // Qualifier
      const match = line.match(/^\s{21}\/([^=]+)=?(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2].replace(/^"/, '').replace(/"$/, '');
        
        // Qualifier может продолжаться на следующих строках
        currentFeature.qualifiers[key] = value;
      }
    } else if (currentFeature && line.match(/^\s{21}[^\/]/)) {
      // Продолжение предыдущего qualifier
      const lastKey = Object.keys(currentFeature.qualifiers).pop();
      if (lastKey) {
        currentFeature.qualifiers[lastKey] += ' ' + line.trim().replace(/^"/, '').replace(/"$/, '');
      }
    }
  }
  
  // Добавляем последний feature
  if (currentFeature) {
    features.push(currentFeature);
  }
  
  return features;
}

/**
 * Парсит ORIGIN секцию
 */
function parseOrigin(text: string): string {
  // Удаляем номера строк и пробелы
  return text
    .replace(/^\s*\d+/gm, '') // Удаляем номера строк
    .replace(/\s/g, '')       // Удаляем все пробелы
    .replace(/origin/gi, '')  // Удаляем слово ORIGIN
    .toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// 📤 GENBANK WRITING
// ═══════════════════════════════════════════════════════════

/**
 * Конвертирует record в GenBank формат
 */
export function toGenBank(record: GenBankRecord): string {
  const lines: string[] = [];
  
  // LOCUS line
  const locusLine = `LOCUS       ${record.locus.name.padEnd(16)} ` +
    `${record.locus.length} bp    ${record.locus.moleculeType.padEnd(6)} ` +
    `${record.locus.topology.padEnd(8)} ${record.locus.division} ${record.locus.date}`;
  lines.push(locusLine);
  
  // DEFINITION
  if (record.definition) {
    lines.push(`DEFINITION  ${record.definition}`);
  }
  
  // ACCESSION
  if (record.accession) {
    lines.push(`ACCESSION   ${record.accession}`);
  }
  
  // VERSION
  if (record.version) {
    lines.push(`VERSION     ${record.version}`);
  }
  
  // KEYWORDS
  if (record.keywords.length > 0) {
    lines.push(`KEYWORDS    ${record.keywords.join('; ')}.`);
  }
  
  // SOURCE
  if (record.source.organism) {
    lines.push(`SOURCE      ${record.source.organism}`);
    lines.push(`  ORGANISM  ${record.source.organism}`);
    if (record.source.taxonomy.length > 0) {
      lines.push(`            ${record.source.taxonomy.join('; ')}.`);
    }
  }
  
  // FEATURES
  if (record.features.length > 0) {
    lines.push('FEATURES             Location/Qualifiers');
    for (const feature of record.features) {
      lines.push(`     ${feature.type.padEnd(16)}${feature.location}`);
      
      for (const [key, value] of Object.entries(feature.qualifiers)) {
        lines.push(`                     /${key}="${value}"`);
      }
    }
  }
  
  // ORIGIN
  if (record.origin) {
    lines.push('ORIGIN      ');
    
    // Форматируем последовательность (60 символов на строку, группами по 10)
    const sequence = record.origin.toLowerCase();
    let position = 1;
    
    for (let i = 0; i < sequence.length; i += 60) {
      const chunk = sequence.substring(i, i + 60);
      const formatted = chunk.match(/.{1,10}/g)?.join(' ') || chunk;
      lines.push(`${position.toString().padStart(9)} ${formatted}`);
      position += 60;
    }
  }
  
  lines.push('//');
  
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════
// 📁 FILE OPERATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Парсит GenBank файл из пути
 */
export function parseGenBankFile(filepath: string): GenBankRecord[] {
  const content = readFileSync(filepath, 'utf-8');
  return parseGenBank(content);
}

// ═══════════════════════════════════════════════════════════
// 🔍 UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Извлекает последовательность из feature location
 */
export function extractFeatureSequence(
  record: GenBankRecord,
  feature: Feature
): string | null {
  // Парсим location (простой случай: "123..456")
  const match = feature.location.match(/(\d+)\.\.(\d+)/);
  
  if (match) {
    const start = parseInt(match[1]) - 1; // GenBank uses 1-based indexing
    const end = parseInt(match[2]);
    
    return record.origin.substring(start, end);
  }
  
  return null;
}

/**
 * Вычисляет статистику GenBank записи
 */
export function computeRecordStatistics(record: GenBankRecord): RecordStatistics {
  const featureTypes = new Map<string, number>();
  
  for (const feature of record.features) {
    featureTypes.set(feature.type, (featureTypes.get(feature.type) || 0) + 1);
  }
  
  return {
    sequenceLength: record.locus.length,
    featureCount: record.features.length,
    featureTypes: Object.fromEntries(featureTypes),
    geneCount: record.getGenes().length,
    cdsCount: record.getCDS().length,
  };
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface LocusInfo {
  name: string;
  length: number;
  moleculeType: string;
  topology: string;
  division: string;
  date: string;
}

export interface SourceInfo {
  organism: string;
  taxonomy: string[];
}

export interface Reference {
  number: number;
  authors: string[];
  title: string;
  journal: string;
  pubmed?: string;
}

export interface Feature {
  type: string;
  location: string;
  qualifiers: Record<string, string>;
}

export interface RecordStatistics {
  sequenceLength: number;
  featureCount: number;
  featureTypes: Record<string, number>;
  geneCount: number;
  cdsCount: number;
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  GenBankRecord,
  parseGenBank,
  parseGenBankFile,
  toGenBank,
  extractFeatureSequence,
  computeRecordStatistics,
};
