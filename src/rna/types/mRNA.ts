/**
 * 📝 DIVINE KERNEL V12 - mRNA
 */

import { RNASequence } from './rna-sequence.js';

export class mRNA extends RNASequence {
  private start: number = -1;
  private stop: number = -1;

  constructor(sequence: string) {
    super(sequence);
    this.findCodingRegion();
  }

  private findCodingRegion(): void {
    const startCodon = 'AUG';
    const stopCodons = ['UAA', 'UAG', 'UGA'];
    
    this.start = this._sequence.indexOf(startCodon);
    
    if (this.start !== -1) {
      for (let i = this.start + 3; i < this._sequence.length - 2; i += 3) {
        const codon = this._sequence.substring(i, i + 3);
        if (stopCodons.includes(codon)) {
          this.stop = i + 3;
          break;
        }
      }
    }
  }

  getCodingSequence(): string {
    if (this.start === -1 || this.stop === -1) {
      return '';
    }
    return this._sequence.substring(this.start, this.stop);
  }

  get5UTR(): string {
    if (this.start === -1) {
      return '';
    }
    return this._sequence.substring(0, this.start);
  }

  get3UTR(): string {
    if (this.stop === -1) {
      return '';
    }
    return this._sequence.substring(this.stop);
  }

  hasPolyATail(): boolean {
    const tail = this._sequence.slice(-20);
    const aCount = (tail.match(/A/g) || []).length;
    return aCount >= 15;
  }

  has5Cap(): boolean {
    return this._sequence.startsWith('G');
  }
}

export const MessengerRNA = mRNA;
export default mRNA;
