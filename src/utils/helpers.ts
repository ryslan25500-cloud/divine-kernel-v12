/**
 * 🛠️ DIVINE KERNEL V12 - Helper Functions
 */

import {
  VALID_DNA_NUCLEOTIDES,
  VALID_RNA_NUCLEOTIDES,
  type DNANucleotide,
  type RNANucleotide,
  GC_CONTENT,
} from '../core/config/constants.js';

export function randomElement<T>(array: readonly T[] | T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomChoice<T>(array: readonly T[] | T[]): T {
  return randomElement(array);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function chunk<T>(array: T[] | string, size: number): any[] {
  if (typeof array === 'string') {
    const chunks: string[] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function isValidDNA(sequence: string): boolean {
  return sequence.split('').every(char => 
    VALID_DNA_NUCLEOTIDES.includes(char.toUpperCase() as any)
  );
}

export function isValidDNANucleotide(char: string): char is DNANucleotide {
  return VALID_DNA_NUCLEOTIDES.includes(char as any);
}

export function isValidRNANucleotide(char: string): char is RNANucleotide {
  return VALID_RNA_NUCLEOTIDES.includes(char as any);
}

export function normalizeSequence(sequence: string): string {
  return sequence.toUpperCase().replace(/\s/g, '');
}

export function calculateGCContent(sequence: string): number {
  const normalized = normalizeSequence(sequence);
  if (normalized.length === 0) return 0;
  
  const gcCount = (normalized.match(/[GC]/g) || []).length;
  return gcCount / normalized.length;
}

export function reverse(sequence: string): string {
  return sequence.split('').reverse().join('');
}

export function splitIntoCodons(sequence: string): string[] {
  return chunk(sequence, 3) as string[];
}

export function findMotif(sequence: string, motif: string): number[] {
  const positions: number[] = [];
  let pos = sequence.indexOf(motif);
  
  while (pos !== -1) {
    positions.push(pos);
    pos = sequence.indexOf(motif, pos + 1);
  }
  
  return positions;
}

export function countOccurrences(sequence: string, pattern: string): number {
  return (sequence.match(new RegExp(pattern, 'g')) || []).length;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default {
  randomElement, randomChoice, randomInt, randomFloat, shuffle, chunk,
  isValidDNA, isValidDNANucleotide, isValidRNANucleotide,
  normalizeSequence, calculateGCContent, reverse, splitIntoCodons,
  findMotif, countOccurrences, generateUUID, sleep, formatNumber, clamp,
};
