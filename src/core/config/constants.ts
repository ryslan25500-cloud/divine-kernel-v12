/**
 * 🧬 DIVINE KERNEL V12 - Constants (COMPLETE)
 */

// ═══════════════════════════════════════════════════════════
// DNA & RNA
// ═══════════════════════════════════════════════════════════

export const DNA_COMPLEMENT: Record<string, string> = {
  A: 'T', T: 'A', G: 'C', C: 'G', N: 'N',
};

export const RNA_COMPLEMENT: Record<string, string> = {
  A: 'U', U: 'A', G: 'C', C: 'G', N: 'N',
};

export const VALID_DNA_NUCLEOTIDES = ['A', 'T', 'G', 'C', 'N'] as const;
export const VALID_RNA_NUCLEOTIDES = ['A', 'U', 'G', 'C', 'N'] as const;

export type DNANucleotide = typeof VALID_DNA_NUCLEOTIDES[number];
export type RNANucleotide = typeof VALID_RNA_NUCLEOTIDES[number];

export const NUCLEOTIDES = {
  DNA: VALID_DNA_NUCLEOTIDES,
  RNA: VALID_RNA_NUCLEOTIDES,
};

export const GC_NUCLEOTIDES = ['G', 'C'] as const;

export const GC_CONTENT = {
  G: true,
  C: true,
  MIN_VIABLE: 0.2,
  MAX_VIABLE: 0.8,
  OPTIMAL_MIN: 0.4,
  OPTIMAL_MAX: 0.6,
  HUMAN: 0.41,
  ECOLI: 0.506,
};

// ═══════════════════════════════════════════════════════════
// SEQUENCE LIMITS
// ═══════════════════════════════════════════════════════════

export const SEQUENCE_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 10000000,
  MIN_ORF_LENGTH: 150,
  MIN_GENE_LENGTH: 300,
};

// ═══════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════

export const MUTATION_RATES = {
  POINT_MUTATION: 0.001,
  INSERTION: 0.0001,
  DELETION: 0.0001,
  INVERSION: 0.00001,
  DUPLICATION: 0.00001,
  TRANSLOCATION: 0.000001,
};

// ═══════════════════════════════════════════════════════════
// GENETIC CODE
// ═══════════════════════════════════════════════════════════

export const GENETIC_CODE: Record<string, string> = {
  UUU: 'F', UUC: 'F', UUA: 'L', UUG: 'L',
  UCU: 'S', UCC: 'S', UCA: 'S', UCG: 'S',
  UAU: 'Y', UAC: 'Y', UAA: '*', UAG: '*',
  UGU: 'C', UGC: 'C', UGA: '*', UGG: 'W',
  CUU: 'L', CUC: 'L', CUA: 'L', CUG: 'L',
  CCU: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  CAU: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  CGU: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AUU: 'I', AUC: 'I', AUA: 'I', AUG: 'M',
  ACU: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  AAU: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  AGU: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GUU: 'V', GUC: 'V', GUA: 'V', GUG: 'V',
  GCU: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  GAU: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  GGU: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
};

export const CODON_TABLE = GENETIC_CODE;

export const START_CODONS = ['ATG'];
export const STOP_CODONS = ['TAA', 'TAG', 'TGA'];
export const STOP_CODONS_RNA = ['UAA', 'UAG', 'UGA'];

// ═══════════════════════════════════════════════════════════
// AMINO ACIDS
// ═══════════════════════════════════════════════════════════

export const AMINO_ACIDS = [
  'A', 'R', 'N', 'D', 'C', 'Q', 'E', 'G', 'H', 'I',
  'L', 'K', 'M', 'F', 'P', 'S', 'T', 'W', 'Y', 'V', '*'
] as const;

export const AMINO_ACID_WEIGHTS: Record<string, number> = {
  A: 89.1, R: 174.2, N: 132.1, D: 133.1, C: 121.2,
  Q: 146.2, E: 147.1, G: 75.1, H: 155.2, I: 131.2,
  L: 131.2, K: 146.2, M: 149.2, F: 165.2, P: 115.1,
  S: 105.1, T: 119.1, W: 204.2, Y: 181.2, V: 117.1,
  '*': 0,
};

export const AMINO_ACID_NAMES: Record<string, string> = {
  A: 'Alanine', R: 'Arginine', N: 'Asparagine', D: 'Aspartic acid',
  C: 'Cysteine', Q: 'Glutamine', E: 'Glutamic acid', G: 'Glycine',
  H: 'Histidine', I: 'Isoleucine', L: 'Leucine', K: 'Lysine',
  M: 'Methionine', F: 'Phenylalanine', P: 'Proline', S: 'Serine',
  T: 'Threonine', W: 'Tryptophan', Y: 'Tyrosine', V: 'Valine',
  '*': 'Stop',
};

// ═══════════════════════════════════════════════════════════
// MOTIFS
// ═══════════════════════════════════════════════════════════

export const MOTIFS = {
  TATA_BOX: 'TATAAA',
  POLY_A_SIGNAL: 'AATAAA',
  KOZAK_CONSENSUS: 'GCCACCATGG',
  SHINE_DALGARNO: 'AGGAGGT',
};

// ═══════════════════════════════════════════════════════════
// BLOCKCHAIN ENCODING
// ═══════════════════════════════════════════════════════════

export const HEX_TO_NUCLEOTIDE: Record<string, string> = {
  '0': 'A', '1': 'C', '2': 'G', '3': 'T',
  '4': 'A', '5': 'C', '6': 'G', '7': 'T',
  '8': 'A', '9': 'C', 'a': 'G', 'b': 'T',
  'c': 'A', 'd': 'C', 'e': 'G', 'f': 'T',
};

export type BlockchainType = 'bitcoin' | 'ethereum' | 'solana';

export const BLOCKCHAINS = {
  BITCOIN: 'bitcoin' as BlockchainType,
  ETHEREUM: 'ethereum' as BlockchainType,
  SOLANA: 'solana' as BlockchainType,
};

// ═══════════════════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════════════════

export const DATABASE = {
  POOL_MIN: 2,
  POOL_MAX: 10,
  IDLE_TIMEOUT: 30000,
  CONNECTION_TIMEOUT: 2000,
};

// ═══════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════

export const DEFAULT_CONFIG = {
  MIN_SEQUENCE_LENGTH: 10,
  MAX_SEQUENCE_LENGTH: 1000000,
  DEFAULT_GC_CONTENT: 0.5,
  MIN_ORF_LENGTH: 150,
  MIN_GENE_LENGTH: 300,
};

export const DEFAULT_GENOME = {
  id: 'default',
  sequence: '',
  metadata: {},
};

// ═══════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════

exp
