/**
 * 📝 DIVINE KERNEL V12 - RNA Sequence Base Class
 */

import { VALID_RNA_NUCLEOTIDES } from '../../core/config/constants.js';

export class RNASequence {
  protected _sequence: string;

  constructor(sequence: string) {
    const normalized = sequence.toUpperCase().replace(/\s/g, '');
    
    for (const char of normalized) {
      if (!VALID_RNA_NUCLEOTIDES.includes(char as any)) {
        throw new Error(`Invalid RNA nucleotide: ${char}`);
      }
    }
    
    this._sequence = normalized;
  }

  get sequence(): string {
    return this._sequence;
  }

  get length(): number {
    return this._sequence.length;
  }

  toString(): string {
    return this._sequence;
  }
}

export default RNASequence;
