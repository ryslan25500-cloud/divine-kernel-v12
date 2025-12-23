/**
 * 🧬 DIVINE KERNEL V12 - DNA Mutations
 */

import { DNASequence } from './sequence.js';
import { randomChoice, randomInt } from '../utils/helpers.js';
import { NUCLEOTIDES, MUTATION_RATES } from '../core/config/constants.js';

export interface Mutation {
  type: 'point' | 'insertion' | 'deletion' | 'inversion' | 'duplication';
  position: number;
  original?: string;
  mutated?: string;
  description?: string;
}

export interface MutationOptions {
  pointMutationRate?: number;
  insertionRate?: number;
  deletionRate?: number;
}

export interface MutationResult {
  sequence: DNASequence;
  mutations: Mutation[];
  totalMutations: number;
}

export function mutate(
  sequence: DNASequence,
  rateOrOptions: number | MutationOptions
): MutationResult {
  const rate = typeof rateOrOptions === 'number' ? rateOrOptions : 0.001;
  const mutations: Mutation[] = [];
  let mutatedSeq = sequence.sequence;

  for (let i = 0; i < mutatedSeq.length; i++) {
    if (Math.random() < rate) {
      const nucleotides = ['A', 'T', 'G', 'C'];
      const current = mutatedSeq[i];
      const newNuc = randomChoice(nucleotides.filter(n => n !== current));
      
      mutatedSeq = mutatedSeq.substring(0, i) + newNuc + mutatedSeq.substring(i + 1);
      
      mutations.push({
        type: 'point',
        position: i,
        original: current,
        mutated: newNuc,
        description: `Point mutation at position ${i}: ${current} → ${newNuc}`,
      });
    }
  }

  return {
    sequence: new DNASequence(mutatedSeq),
    mutations,
    totalMutations: mutations.length,
  };
}

export function pointMutation(sequence: DNASequence, position: number, newNucleotide: string): DNASequence {
  const seq = sequence.sequence;
  return new DNASequence(seq.substring(0, position) + newNucleotide + seq.substring(position + 1));
}

export function insertion(sequence: DNASequence, position: number, nucleotides: string): DNASequence {
  const seq = sequence.sequence;
  return new DNASequence(seq.substring(0, position) + nucleotides + seq.substring(position));
}

export function deletion(sequence: DNASequence, start: number, end: number): DNASequence {
  const seq = sequence.sequence;
  return new DNASequence(seq.substring(0, start) + seq.substring(end));
}

export default {
  mutate,
  pointMutation,
  insertion,
  deletion,
};
