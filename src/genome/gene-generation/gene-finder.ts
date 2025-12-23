/**
 * 🔍 DIVINE KERNEL V12 - Gene Finder (Simplified)
 */

import { DNASequence } from '../../dna/sequence.js';

export interface Gene {
  id: string;
  start: number;
  end: number;
  length: number;
  strand: '+' | '-';
  frame: number;
  sequence: string;
  gcContent: number;
  hasPromoter: boolean;
  promoterPosition?: number;
  hasShineDalgarno: boolean;
  shineDalgarnoPosition?: number;
}

export class GeneFinder {
  private minGeneLength: number;
  
  constructor(options: { minGeneLength?: number } = {}) {
    this.minGeneLength = options.minGeneLength || 300;
  }
  
  findGenes(sequence: DNASequence): Gene[] {
    const orfs = sequence.findORFs(this.minGeneLength);
    
    return orfs.map((orf, index) => ({
      id: `gene_${index + 1}`,
      start: orf.start,
      end: orf.end,
      length: orf.length,
      strand: orf.strand,
      frame: orf.frame,
      sequence: orf.sequence,
      gcContent: new DNASequence(orf.sequence).gcContent,
      hasPromoter: false,
      hasShineDalgarno: false,
    }));
  }
}

export default GeneFinder;
