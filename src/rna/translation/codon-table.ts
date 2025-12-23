/**
 * 🧬 DIVINE KERNEL V12 - Codon Table
 */

import { GENETIC_CODE, AMINO_ACID_NAMES } from '../../core/config/constants.js';

export function translateCodon(codon: string): string {
  const upperCodon = codon.toUpperCase();
  return GENETIC_CODE[upperCodon] || 'X';
}

export function isStartCodon(codon: string): boolean {
  return codon.toUpperCase() === 'AUG';
}

export function isStopCodon(codon: string): boolean {
  const upperCodon = codon.toUpperCase();
  return upperCodon === 'UAA' || upperCodon === 'UAG' || upperCodon === 'UGA';
}

export function getAminoAcidName(abbreviation: string): string {
  return AMINO_ACID_NAMES[abbreviation.toUpperCase()] || 'Unknown';
}

export function getAminoAcidAbbreviation(name: string): string {
  const entries = Object.entries(AMINO_ACID_NAMES);
  const found = entries.find(([_, n]) => n.toLowerCase() === name.toLowerCase());
  return found ? found[0] : 'X';
}

export function getCodonUsage(sequence: string): Record<string, number> {
  const usage: Record<string, number> = {};
  
  for (let i = 0; i < sequence.length - 2; i += 3) {
    const codon = sequence.substring(i, i + 3);
    if (codon.length === 3) {
      usage[codon] = (usage[codon] || 0) + 1;
    }
  }
  
  return usage;
}

export const CODON_TABLE = GENETIC_CODE;

export default {
  translateCodon,
  isStartCodon,
  isStopCodon,
  getAminoAcidName,
  getAminoAcidAbbreviation,
  getCodonUsage,
  CODON_TABLE,
};
