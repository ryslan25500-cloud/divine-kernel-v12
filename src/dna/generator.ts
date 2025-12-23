/**
 * 🧬 DIVINE KERNEL V12 - DNA Generator (Fixed)
 */

import { DNASequence } from './sequence.js';
import { randomElement } from '../utils/helpers.js';
import { GC_CONTENT } from '../core/config/constants.js';

export interface GenerateOptions {
  gcContent?: number;
  organism?: 'human' | 'ecoli' | 'random';
}

export function generateRandom(
  length: number,
  options: GenerateOptions = {}
): DNASequence {
  const {
    gcContent = 0.5,
    organism = 'random',
  } = options;

  let targetGC = gcContent;
  
  if (organism === 'human') {
    targetGC = GC_CONTENT.HUMAN;
  } else if (organism === 'ecoli') {
    targetGC = GC_CONTENT.ECOLI;
  }

  const gcNucleotides = ['G', 'C'];
  const atNucleotides = ['A', 'T'];
  
  let sequence = '';
  
  for (let i = 0; i < length; i++) {
    if (Math.random() < targetGC) {
      sequence += randomElement(gcNucleotides);
    } else {
      sequence += randomElement(atNucleotides);
    }
  }
  
  return new DNASequence(sequence);
}

export function generateWithPattern(
  pattern: string,
  repeats: number
): DNASequence {
  return new DNASequence(pattern.repeat(repeats));
}

export function generateCodingSequence(
  aminoAcidLength: number
): DNASequence {
  const codons = [
    'ATG', // Start
    'GCT', 'GCC', 'GCA', 'GCG', // Alanine
    'CGT', 'CGC', 'CGA', 'CGG', // Arginine
    'AAT', 'AAC', // Asparagine
    'GAT', 'GAC', // Aspartic acid
    'TGT', 'TGC', // Cysteine
  ];

  let sequence = 'ATG'; // Start codon
  
  for (let i = 0; i < aminoAcidLength - 1; i++) {
    sequence += randomElement(codons);
  }
  
  sequence += randomElement(['TAA', 'TAG', 'TGA']); // Stop codon
  
  return new DNASequence(sequence);
}

export default {
  generateRandom,
  generateWithPattern,
  generateCodingSequence,
};
