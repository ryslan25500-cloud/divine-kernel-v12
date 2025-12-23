/**
 * 🧪 DIVINE KERNEL V12 - Protein Sequence
 */

import { AMINO_ACID_WEIGHTS } from '../../core/config/constants.js';

export class ProteinSequence {
  sequence: string;
  length: number;

  constructor(sequence: string) {
    this.sequence = sequence.toUpperCase();
    this.length = sequence.length;
  }

  getMolecularWeight(): number {
    let weight = 0;
    
    for (const aa of this.sequence) {
      weight += AMINO_ACID_WEIGHTS[aa] || 0;
    }
    
    // Subtract water molecules (n-1)
    if (this.length > 1) {
      weight -= (this.length - 1) * 18.015;
    }
    
    return weight;
  }

  toString(): string {
    return this.sequence;
  }
}

export default ProteinSequence;
