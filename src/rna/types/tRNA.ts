/**
 * 📝 DIVINE KERNEL V12 - tRNA
 */

import { RNASequence } from './rna-sequence.js';
import { AMINO_ACIDS } from '../../core/config/constants.js';

export class tRNA extends RNASequence {
  anticodon: string;
  aminoAcid: string;

  constructor(sequence: string, anticodon: string, aminoAcid: string) {
    super(sequence);
    
    if (anticodon.length !== 3) {
      throw new Error('Anticodon must be 3 nucleotides');
    }
    
    if (!AMINO_ACIDS.includes(aminoAcid as any)) {
      throw new Error(`Invalid amino acid: ${aminoAcid}`);
    }
    
    this.anticodon = anticodon;
    this.aminoAcid = aminoAcid;
  }

  getAnticodon(): string {
    return this.anticodon;
  }

  getAminoAcid(): string {
    return this.aminoAcid;
  }

  isValidStructure(): boolean {
    return this._sequence.length >= 75 && this._sequence.length <= 95;
  }
}

export const TransferRNA = tRNA;
export default tRNA;
