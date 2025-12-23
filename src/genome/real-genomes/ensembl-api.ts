/**
 * 🧬 DIVINE KERNEL V12 - Ensembl API Integration
 * 
 * Интеграция с Ensembl REST API для загрузки геномных данных.
 * Поддержка позвоночных и модельных организмов.
 */

import { DNASequence } from '../../dna/sequence.js';
import { log } from '../../utils/logger.js';

// ═══════════════════════════════════════════════════════════
// 🧬 ENSEMBL API CLIENT
// ═══════════════════════════════════════════════════════════

export class EnsemblClient {
  private baseUrl: string;
  private version: string;
  
  constructor(options: EnsemblClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://rest.ensembl.org';
    this.version = options.version || 'latest';
  }
  
  /**
   * Выполняет GET запрос к API
   */
  private async get(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    try {
      const response = await fetch(url.toString(), { headers });
      
      if (!response.ok) {
        throw new Error(`Ensembl API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      log.error(`Ensembl API request failed: ${error}`);
      throw error;
    }
  }
  
  /**
   * Получает информацию о геноме
   */
  async getGenomeInfo(species: string): Promise<GenomeInfo> {
    log.info(`Getting genome info for ${species}`);
    
    const data = await this.get(`/info/assembly/${species}`);
    
    return {
      species: species,
      assembly: data.assembly_name,
      chromosomes: data.karyotype || [],
      totalLength: data.base_count || 0,
      accession: data.assembly_accession,
    };
  }
  
  /**
   * Получает последовательность региона
   */
  async getSequence(
    species: string,
    region: string,
    options: SequenceOptions = {}
  ): Promise<DNASequence> {
    const {
      expand_3prime = 0,
      expand_5prime = 0,
    } = options;
    
    log.info(`Fetching sequence for ${species}:${region}`);
    
    const params: Record<string, string> = {};
    if (expand_3prime > 0) params.expand_3prime = expand_3prime.toString();
    if (expand_5prime > 0) params.expand_5prime = expand_5prime.toString();
    
    const data = await this.get(`/sequence/region/${species}/${region}`, params);
    
    return new DNASequence(data.seq);
  }
  
  /**
   * Получает последовательность гена
   */
  async getGeneSequence(species: string, geneId: string): Promise<GeneSequenceInfo> {
    log.info(`Fetching gene ${geneId} from ${species}`);
    
    const data = await this.get(`/sequence/id/${geneId}`, {
      species,
      type: 'genomic',
    });
    
    return {
      id: data.id,
      sequence: new DNASequence(data.seq),
      description: data.desc,
      length: data.seq.length,
    };
  }
  
  /**
   * Получает CDS (coding sequence)
   */
  async getCDS(species: string, transcriptId: string): Promise<DNASequence> {
    log.info(`Fetching CDS for ${transcriptId}`);
    
    const data = await this.get(`/sequence/id/${transcriptId}`, {
      species,
      type: 'cds',
    });
    
    return new DNASequence(data.seq);
  }
  
  /**
   * Получает белковую последовательность
   */
  async getProteinSequence(species: string, proteinId: string): Promise<string> {
    log.info(`Fetching protein ${proteinId}`);
    
    const data = await this.get(`/sequence/id/${proteinId}`, {
      species,
      type: 'protein',
    });
    
    return data.seq;
  }
  
  /**
   * Ищет гены
   */
  async searchGenes(species: string, query: string): Promise<GeneSearchResult[]> {
    log.info(`Searching genes in ${species}: ${query}`);
    
    const data = await this.get(`/lookup/symbol/${species}/${query}`, {
      expand: '1',
    });
    
    if (Array.isArray(data)) {
      return data.map(item => this.parseGeneResult(item));
    } else {
      return [this.parseGeneResult(data)];
    }
  }
  
  /**
   * Парсит результат поиска гена
   */
  private parseGeneResult(data: any): GeneSearchResult {
    return {
      id: data.id,
      name: data.display_name,
      description: data.description,
      chromosome: data.seq_region_name,
      start: data.start,
      end: data.end,
      strand: data.strand === 1 ? '+' : '-',
      biotype: data.biotype,
    };
  }
  
  /**
   * Получает варианты (SNPs, mutations)
   */
  async getVariants(
    species: string,
    region: string
  ): Promise<Variant[]> {
    log.info(`Fetching variants for ${species}:${region}`);
    
    try {
      const data = await this.get(`/overlap/region/${species}/${region}`, {
        feature: 'variation',
      });
      
      return data.map((v: any) => ({
        id: v.id,
        position: v.start,
        alleles: v.alleles || [],
        type: v.consequence_type,
      }));
    } catch (error) {
      log.warn(`Failed to fetch variants: ${error}`);
      return [];
    }
  }
  
  /**
   * Получает список доступных видов
   */
  async getSpecies(): Promise<SpeciesInfo[]> {
    log.info('Fetching species list');
    
    const data = await this.get('/info/species');
    
    return data.species.map((s: any) => ({
      name: s.name,
      displayName: s.display_name,
      taxonId: s.taxon_id,
      assembly: s.assembly,
      hasVariation: s.has_variation === 1,
    }));
  }
  
  /**
   * Получает homology (ортологи)
   */
  async getHomologs(
    species: string,
    geneId: string,
    targetSpecies?: string
  ): Promise<Homolog[]> {
    log.info(`Fetching homologs for ${geneId}`);
    
    const params: Record<string, string> = {
      species,
    };
    
    if (targetSpecies) {
      params.target_species = targetSpecies;
    }
    
    const data = await this.get(`/homology/id/${geneId}`, params);
    
    if (!data.data || !data.data[0]) {
      return [];
    }
    
    const homologies = data.data[0].homologies || [];
    
    return homologies.map((h: any) => ({
      geneId: h.target.id,
      species: h.target.species,
      proteinId: h.target.protein_id,
      identity: h.target.perc_id,
      type: h.type,
    }));
  }
}

// ═══════════════════════════════════════════════════════════
// 🐭 POPULAR MODEL ORGANISMS
// ═══════════════════════════════════════════════════════════

/**
 * Популярные модельные организмы в Ensembl
 */
export const MODEL_ORGANISMS = {
  HUMAN: 'homo_sapiens',
  MOUSE: 'mus_musculus',
  RAT: 'rattus_norvegicus',
  ZEBRAFISH: 'danio_rerio',
  FLY: 'drosophila_melanogaster',
  WORM: 'caenorhabditis_elegans',
  YEAST: 'saccharomyces_cerevisiae',
  ARABIDOPSIS: 'arabidopsis_thaliana',
  RICE: 'oryza_sativa',
  DOG: 'canis_familiaris',
  CAT: 'felis_catus',
  CHICKEN: 'gallus_gallus',
} as const;

/**
 * Популярные гены для тестирования
 */
export const POPULAR_GENES = {
  HUMAN_BRCA1: 'ENSG00000012048',
  HUMAN_TP53: 'ENSG00000141510',
  HUMAN_APOE: 'ENSG00000130203',
  MOUSE_PAX6: 'ENSMUSG00000027168',
  FLY_EYELESS: 'FBgn0005558',
} as const;

/**
 * Загружает геном модельного организма
 */
export async function downloadModelOrganism(
  organism: keyof typeof MODEL_ORGANISMS,
  chromosome: string
): Promise<DNASequence> {
  const client = new EnsemblClient();
  const species = MODEL_ORGANISMS[organism];
  
  log.info(`Downloading ${organism} chromosome ${chromosome}`);
  
  return await client.getSequence(species, chromosome);
}

/**
 * Загружает популярный ген
 */
export async function downloadPopularGene(
  gene: keyof typeof POPULAR_GENES
): Promise<GeneSequenceInfo> {
  const client = new EnsemblClient();
  const geneId = POPULAR_GENES[gene];
  
  // Определяем species из geneId
  let species = 'homo_sapiens';
  if (geneId.startsWith('ENSMOUS')) species = 'mus_musculus';
  if (geneId.startsWith('FBgn')) species = 'drosophila_melanogaster';
  
  log.info(`Downloading ${gene} (${geneId})`);
  
  return await client.getGeneSequence(species, geneId);
}

// ═══════════════════════════════════════════════════════════
// 🔍 GENOME BROWSER
// ═══════════════════════════════════════════════════════════

/**
 * Создаёт URL для Ensembl genome browser
 */
export function getGenomeBrowserURL(
  species: string,
  chromosome: string,
  start: number,
  end: number
): string {
  return `https://www.ensembl.org/${species}/Location/View?r=${chromosome}:${start}-${end}`;
}

/**
 * Создаёт URL для гена в browser
 */
export function getGeneURL(species: string, geneId: string): string {
  return `https://www.ensembl.org/${species}/Gene/Summary?g=${geneId}`;
}

// ═══════════════════════════════════════════════════════════
// 🔧 UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Форматирует region string
 */
export function formatRegion(
  chromosome: string,
  start: number,
  end: number
): string {
  return `${chromosome}:${start}-${end}`;
}

/**
 * Парсит region string
 */
export function parseRegion(region: string): {
  chromosome: string;
  start: number;
  end: number;
} | null {
  const match = region.match(/^(.+):(\d+)-(\d+)$/);
  
  if (match) {
    return {
      chromosome: match[1],
      start: parseInt(match[2]),
      end: parseInt(match[3]),
    };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════
// 🎯 TYPES
// ═══════════════════════════════════════════════════════════

export interface EnsemblClientOptions {
  baseUrl?: string;
  version?: string;
}

export interface GenomeInfo {
  species: string;
  assembly: string;
  chromosomes: string[];
  totalLength: number;
  accession: string;
}

export interface SequenceOptions {
  expand_3prime?: number;
  expand_5prime?: number;
}

export interface GeneSequenceInfo {
  id: string;
  sequence: DNASequence;
  description: string;
  length: number;
}

export interface GeneSearchResult {
  id: string;
  name: string;
  description: string;
  chromosome: string;
  start: number;
  end: number;
  strand: '+' | '-';
  biotype: string;
}

export interface Variant {
  id: string;
  position: number;
  alleles: string[];
  type: string;
}

export interface SpeciesInfo {
  name: string;
  displayName: string;
  taxonId: number;
  assembly: string;
  hasVariation: boolean;
}

export interface Homolog {
  geneId: string;
  species: string;
  proteinId: string;
  identity: number;
  type: string;
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  EnsemblClient,
  MODEL_ORGANISMS,
  POPULAR_GENES,
  downloadModelOrganism,
  downloadPopularGene,
  getGenomeBrowserURL,
  getGeneURL,
  formatRegion,
  parseRegion,
};
