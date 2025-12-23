/**
 * 🧪 DIVINE KERNEL V12 - UniProt API Integration
 * 
 * Интеграция с UniProt для загрузки белковых последовательностей.
 * Поддержка Swiss-Prot и TrEMBL баз данных.
 */

import { log } from '../../utils/logger.js';

// ═══════════════════════════════════════════════════════════
// 🧪 UNIPROT API CLIENT
// ═══════════════════════════════════════════════════════════

export class UniProtClient {
  private baseUrl: string;
  
  constructor(options: UniProtClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://rest.uniprot.org';
  }
  
  /**
   * Выполняет GET запрос к API
   */
  private async get(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }
    
    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`UniProt API error: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      log.error(`UniProt API request failed: ${error}`);
      throw error;
    }
  }
  
  /**
   * Получает белок по accession
   */
  async getProtein(accession: string, format: 'json' | 'fasta' | 'txt' = 'json'): Promise<any> {
    log.info(`Fetching protein ${accession} (${format})`);
    
    const endpoint = `/uniprotkb/${accession}`;
    const params: Record<string, string> = { format };
    
    return await this.get(endpoint, params);
  }
  
  /**
   * Получает белковую последовательность в FASTA
   */
  async getProteinSequence(accession: string): Promise<ProteinSequence> {
    log.info(`Fetching protein sequence ${accession}`);
    
    const fasta = await this.getProtein(accession, 'fasta');
    
    // Парсим FASTA
    const lines = fasta.split('\n');
    const header = lines[0].substring(1); // Убираем >
    const sequence = lines.slice(1).join('').replace(/\s/g, '');
    
    // Парсим header
    const match = header.match(/^(\S+)\s+(.+)$/);
    const id = match ? match[1] : accession;
    const description = match ? match[2] : '';
    
    return {
      accession: id.split('|')[1] || id,
      sequence,
      length: sequence.length,
      description,
    };
  }
  
  /**
   * Получает полную информацию о белке
   */
  async getProteinInfo(accession: string): Promise<ProteinInfo> {
    log.info(`Fetching protein info ${accession}`);
    
    const data = await this.getProtein(accession, 'json');
    
    // Извлекаем основную информацию
    const proteinName = data.proteinDescription?.recommendedName?.fullName?.value || 'Unknown';
    const geneName = data.genes?.[0]?.geneName?.value || 'Unknown';
    const organism = data.organism?.scientificName || 'Unknown';
    const sequence = data.sequence?.value || '';
    
    return {
      accession,
      proteinName,
      geneName,
      organism,
      sequence,
      length: data.sequence?.length || 0,
      mass: data.sequence?.molWeight || 0,
      reviewed: data.entryType === 'UniProtKB reviewed (Swiss-Prot)',
      functions: this.extractFunctions(data),
      subcellularLocation: this.extractLocations(data),
      domains: this.extractDomains(data),
      keywords: this.extractKeywords(data),
    };
  }
  
  /**
   * Извлекает функции белка
   */
  private extractFunctions(data: any): string[] {
    const functions: string[] = [];
    
    if (data.comments) {
      for (const comment of data.comments) {
        if (comment.commentType === 'FUNCTION') {
          functions.push(comment.texts?.[0]?.value || '');
        }
      }
    }
    
    return functions;
  }
  
  /**
   * Извлекает subcellular locations
   */
  private extractLocations(data: any): string[] {
    const locations: string[] = [];
    
    if (data.comments) {
      for (const comment of data.comments) {
        if (comment.commentType === 'SUBCELLULAR LOCATION') {
          if (comment.subcellularLocations) {
            for (const loc of comment.subcellularLocations) {
              if (loc.location?.value) {
                locations.push(loc.location.value);
              }
            }
          }
        }
      }
    }
    
    return locations;
  }
  
  /**
   * Извлекает домены
   */
  private extractDomains(data: any): Domain[] {
    const domains: Domain[] = [];
    
    if (data.features) {
      for (const feature of data.features) {
        if (feature.type === 'Domain') {
          domains.push({
            type: feature.type,
            description: feature.description || 'Unknown',
            start: feature.location?.start?.value || 0,
            end: feature.location?.end?.value || 0,
          });
        }
      }
    }
    
    return domains;
  }
  
  /**
   * Извлекает keywords
   */
  private extractKeywords(data: any): string[] {
    if (data.keywords) {
      return data.keywords.map((k: any) => k.name);
    }
    return [];
  }
  
  /**
   * Ищет белки
   */
  async searchProteins(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const {
      size = 25,
      fields = 'accession,id,protein_name,gene_names,organism_name,length',
      reviewed = undefined,
    } = options;
    
    log.info(`Searching proteins: ${query}`);
    
    let searchQuery = query;
    
    // Добавляем фильтр reviewed если указан
    if (reviewed !== undefined) {
      searchQuery += ` AND reviewed:${reviewed}`;
    }
    
    const params = {
      query: searchQuery,
      format: 'json',
      size: size.toString(),
      fields,
    };
    
    const data = await this.get('/uniprotkb/search', params);
    
    return {
      count: data.results?.length || 0,
      results: data.results?.map((r: any) => this.parseSearchResult(r)) || [],
    };
  }
  
  /**
   * Парсит результат поиска
   */
  private parseSearchResult(data: any): ProteinSearchResult {
    return {
      accession: data.primaryAccession,
      id: data.uniProtkbId,
      proteinName: data.proteinDescription?.recommendedName?.fullName?.value || 'Unknown',
      geneName: data.genes?.[0]?.geneName?.value || 'Unknown',
      organism: data.organism?.scientificName || 'Unknown',
      length: data.sequence?.length || 0,
      reviewed: data.entryType === 'UniProtKB reviewed (Swiss-Prot)',
    };
  }
  
  /**
   * Получает ортологи белка
   */
  async getOrthologs(accession: string): Promise<Ortholog[]> {
    log.info(`Fetching orthologs for ${accession}`);
    
    const data = await this.getProtein(accession, 'json');
    
    const orthologs: Ortholog[] = [];
    
    if (data.uniProtKBCrossReferences) {
      for (const ref of data.uniProtKBCrossReferences) {
        if (ref.database === 'OrthoDB' || ref.database === 'OMA') {
          orthologs.push({
            database: ref.database,
            id: ref.id,
          });
        }
      }
    }
    
    return orthologs;
  }
  
  /**
   * Получает структуры (PDB)
   */
  async getStructures(accession: string): Promise<Structure[]> {
    log.info(`Fetching structures for ${accession}`);
    
    const data = await this.getProtein(accession, 'json');
    
    const structures: Structure[] = [];
    
    if (data.uniProtKBCrossReferences) {
      for (const ref of data.uniProtKBCrossReferences) {
        if (ref.database === 'PDB') {
          structures.push({
            pdbId: ref.id,
            method: ref.properties?.find((p: any) => p.key === 'Method')?.value || 'Unknown',
            resolution: ref.properties?.find((p: any) => p.key === 'Resolution')?.value || 'N/A',
          });
        }
      }
    }
    
    return structures;
  }
  
  /**
   * Batch загрузка белков
   */
  async fetchBatch(accessions: string[]): Promise<ProteinSequence[]> {
    const results: ProteinSequence[] = [];
    
    // UniProt rate limit: ~1 request per second without API key
    const delay = 1100;
    
    for (const accession of accessions) {
      try {
        const protein = await this.getProteinSequence(accession);
        results.push(protein);
        
        // Задержка между запросами
        await sleep(delay);
      } catch (error) {
        log.warn(`Failed to fetch ${accession}: ${error}`);
      }
    }
    
    log.info(`Batch downloaded ${results.length}/${accessions.length} proteins`);
    
    return results;
  }
}

// ═══════════════════════════════════════════════════════════
// 🧪 ПОПУЛЯРНЫЕ БЕЛКИ
// ═══════════════════════════════════════════════════════════

/**
 * Популярные белки для тестирования
 */
export const POPULAR_PROTEINS = {
  // Structural proteins
  HUMAN_INSULIN: 'P01308',
  HUMAN_HEMOGLOBIN_ALPHA: 'P69905',
  HUMAN_HEMOGLOBIN_BETA: 'P68871',
  
  // Enzymes
  HUMAN_TRYPSIN: 'P07477',
  HUMAN_LYSOZYME: 'P61626',
  
  // Signaling
  HUMAN_P53: 'P04637',
  HUMAN_EGFR: 'P00533',
  
  // Antibodies
  MOUSE_IGG: 'P01863',
  
  // Model organisms
  ECOLI_LACZ: 'P00722', // β-galactosidase
  YEAST_HIS3: 'P06633',
} as const;

/**
 * Загружает популярный белок
 */
export async function downloadPopularProtein(
  name: keyof typeof POPULAR_PROTEINS
): Promise<ProteinInfo> {
  const client = new UniProtClient();
  const accession = POPULAR_PROTEINS[name];
  
  log.info(`Downloading ${name} (${accession})`);
  
  return await client.getProteinInfo(accession);
}

// ═══════════════════════════════════════════════════════════
// 🔍 PROTEIN ANALYSIS
// ═══════════════════════════════════════════════════════════

/**
 * Вычисляет молекулярный вес белка
 */
export function calculateMolecularWeight(sequence: string): number {
  // Средние молекулярные веса аминокислот
  const weights: Record<string, number> = {
    A: 89.1,  G: 75.1,  M: 149.2, S: 105.1, C: 121.2,
    H: 155.2, N: 132.1, T: 119.1, D: 133.1, I: 131.2,
    P: 115.1, V: 117.1, E: 147.1, K: 146.2, Q: 146.2,
    W: 204.2, F: 165.2, L: 131.2, R: 174.2, Y: 181.2,
  };
  
  let weight = 0;
  
  for (const aa of sequence.toUpperCase()) {
    weight += weights[aa] || 0;
  }
  
  // Вычитаем воду за пептидные связи
  weight -= (sequence.length - 1) * 18.015;
  
  return weight;
}

/**
 * Вычисляет изоэлектрическую точку (pI)
 */
export function calculateIsoelectricPoint(sequence: string): number {
  // Упрощённый расчёт
  // В реальности нужен более точный алгоритм
  
  const charged: Record<string, number> = {
    K: 1,  R: 1,  H: 0.5,  // Positive
    D: -1, E: -1, C: -0.5, Y: -0.5, // Negative
  };
  
  let netCharge = 0;
  
  for (const aa of sequence.toUpperCase()) {
    netCharge += charged[aa] || 0;
  }
  
  // Примерная оценка pI
  const pI = 7.0 + netCharge / sequence.length * 2;
  
  return Math.max(3, Math.min(11, pI));
}

/**
 * Анализирует аминокислотный состав
 */
export function analyzeComposition(sequence: string): AminoAcidComposition {
  const counts: Record<string, number> = {};
  
  for (const aa of sequence.toUpperCase()) {
    counts[aa] = (counts[aa] || 0) + 1;
  }
  
  const length = sequence.length;
  const frequencies: Record<string, number> = {};
  
  for (const [aa, count] of Object.entries(counts)) {
    frequencies[aa] = count / length;
  }
  
  return { counts, frequencies, length };
}

// ═══════════════════════════════════════════════════════════
// 🔧 UTILITIES
// ═══════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Конвертирует UniProt accession в URL
 */
export function getProteinURL(accession: string): string {
  return `https://www.uniprot.org/uniprotkb/${accession}`;
}

/**
 * Проверяет валидность accession
 */
export function isValidAccession(accession: string): boolean {
  // UniProt accession formats:
  // - [OPQ][0-9][A-Z0-9]{3}[0-9] (Swiss-Prot)
  // - [A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2} (TrEMBL)
  
  const patterns = [
    /^[OPQ][0-9][A-Z0-9]{3}[0-9]$/,
    /^[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$/,
  ];
  
  return patterns.some(pattern => pattern.test(accession));
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface UniProtClientOptions {
  baseUrl?: string;
}

export interface ProteinSequence {
  accession: string;
  sequence: string;
  length: number;
  description: string;
}

export interface ProteinInfo {
  accession: string;
  proteinName: string;
  geneName: string;
  organism: string;
  sequence: string;
  length: number;
  mass: number;
  reviewed: boolean;
  functions: string[];
  subcellularLocation: string[];
  domains: Domain[];
  keywords: string[];
}

export interface Domain {
  type: string;
  description: string;
  start: number;
  end: number;
}

export interface SearchOptions {
  size?: number;
  fields?: string;
  reviewed?: boolean;
}

export interface SearchResult {
  count: number;
  results: ProteinSearchResult[];
}

export interface ProteinSearchResult {
  accession: string;
  id: string;
  proteinName: string;
  geneName: string;
  organism: string;
  length: number;
  reviewed: boolean;
}

export interface Ortholog {
  database: string;
  id: string;
}

export interface Structure {
  pdbId: string;
  method: string;
  resolution: string;
}

export interface AminoAcidComposition {
  counts: Record<string, number>;
  frequencies: Record<string, number>;
  length: number;
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  UniProtClient,
  POPULAR_PROTEINS,
  downloadPopularProtein,
  calculateMolecularWeight,
  calculateIsoelectricPoint,
  analyzeComposition,
  getProteinURL,
  isValidAccession,
};
