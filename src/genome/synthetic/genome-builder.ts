/**
 * 🏗️ DIVINE KERNEL V12 - Genome Builder
 */

import { DNASequence } from '../../dna/sequence.js';
import { generateRandom } from '../../dna/generator.js';

export interface GeneOptions {
  name: string;
  length: number;
  includePromoter?: boolean;
}

export interface GenomeResult {
  sequence: DNASequence;
  annotations: any[];
  organism: string;
  statistics: {
    geneCount: number;
    codingDensity: number;
  };
}

export class GenomeBuilder {
  private organism: string;
  private genes: GeneOptions[] = [];

  constructor(organism: 'prokaryote' | 'eukaryote' = 'prokaryote') {
    this.organism = organism;
  }

  addGene(options: GeneOptions): this {
    this.genes.push(options);
    return this;
  }

  addIntergenicRegion(length: number): this {
    return this;
  }

  build(): GenomeResult {
    let totalLength = 0;
    const sequences: string[] = [];

    for (const gene of this.genes) {
      const geneSeq = generateRandom(gene.length);
      sequences.push(geneSeq.sequence);
      totalLength += gene.length;
    }

    const fullSequence = sequences.join('');

    return {
      sequence: new DNASequence(fullSequence),
      annotations: this.genes.map((g, i) => ({
        type: 'gene',
        start: i * 300,
        end: (i + 1) * 300,
        name: g.name,
      })),
      organism: this.organism,
      statistics: {
        geneCount: this.genes.length,
        codingDensity: this.genes.length > 0 ? 0.8 : 0,
      },
    };
  }
}

export default GenomeBuilder;
