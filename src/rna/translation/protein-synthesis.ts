/**
 * 🧪 DIVINE KERNEL V12 - Protein Synthesis
 */

import { RNASequence } from '../types/rna-sequence.js';
import { mRNA } from '../types/mRNA.js';
import { tRNA } from '../types/tRNA.js';
import { ProteinSequence } from './protein-sequence.js';
import { translateCodon } from './codon-table.js';

export function translate(rna: RNASequence): ProteinSequence {
  const sequence = rna.sequence;
  let protein = '';
  
  for (let i = 0; i < sequence.length - 2; i += 3) {
    const codon = sequence.substring(i, i + 3);
    const aminoAcid = translateCodon(codon);
    
    if (aminoAcid === '*') {
      break;
    }
    
    protein += aminoAcid;
  }
  
  return new ProteinSequence(protein);
}

export function translateWithStart(rna: RNASequence): ProteinSequence {
  const sequence = rna.sequence;
  const startPos = sequence.indexOf('AUG');
  
  if (startPos === -1) {
    return new ProteinSequence('');
  }
  
  let protein = '';
  
  for (let i = startPos; i < sequence.length - 2; i += 3) {
    const codon = sequence.substring(i, i + 3);
    const aminoAcid = translateCodon(codon);
    
    if (aminoAcid === '*') {
      break;
    }
    
    protein += aminoAcid;
  }
  
  return new ProteinSequence(protein);
}

export const MessengerRNA = mRNA;
export const TransferRNA = tRNA;

export default {
  translate,
  translateWithStart,
  MessengerRNA,
  TransferRNA,
};
