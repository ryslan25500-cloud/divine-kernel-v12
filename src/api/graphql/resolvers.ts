/**
 * 🌐 DIVINE KERNEL V12 - GraphQL Resolvers
 */

import { DNASequence } from '../../dna/sequence.js';
import { generateRandom } from '../../dna/generator.js';
import { mutate } from '../../dna/mutations.js';
import { transcribe } from '../../rna/transcription.js';
import { translate } from '../../rna/translation/protein-synthesis.js';
import { neighborJoining } from '../../tree/algorithms/neighbor-joining.js';
import { hammingDistanceDNA } from '../../tree/distance/hamming.js';
import { GeneFinder } from '../../genome/gene-generation/gene-finder.js';
import { GenomeBuilder } from '../../genome/synthetic/genome-builder.js';

export const resolvers = {
  Query: {
    health: () => 'OK',

    analyzeDNA: (_: any, { sequence }: { sequence: string }) => {
      const dna = new DNASequence(sequence);
      const orfs = dna.findORFs(150);
      const stats = dna.getStatistics();

      return {
        length: dna.length,
        gcContent: dna.gcContent,
        nucleotideCounts: dna.nucleotideCounts,
        orfs,
        statistics: stats,
      };
    },

    findORFs: (_: any, { sequence, minLength = 150 }: { sequence: string; minLength?: number }) => {
      const dna = new DNASequence(sequence);
      return dna.findORFs(minLength);
    },

    findGenes: (_: any, { sequence, minLength = 300 }: { sequence: string; minLength?: number }) => {
      const dna = new DNASequence(sequence);
      const finder = new GeneFinder({ minGeneLength: minLength });
      const genes = finder.findGenes(dna);

      return {
        geneCount: genes.length,
        genes,
      };
    },

    systemStats: () => ({
      version: '12.0.0',
      modules: {
        dna: 'active',
        rna: 'active',
        tree: 'active',
        genome: 'active',
      },
      capabilities: [
        'dna-generation',
        'dna-analysis',
        'mutations',
        'transcription',
        'translation',
        'tree-building',
        'gene-finding',
      ],
    }),
  },

  Mutation: {
    generateDNA: (_: any, { length, gcContent = 0.5 }: { length: number; gcContent?: number }) => {
      const dna = generateRandom(length, { gcContent });
      return {
        sequence: dna.sequence,
        length: dna.length,
        gcContent: dna.gcContent,
      };
    },

    mutateDNA: (_: any, { sequence, mutationRate }: { sequence: string; mutationRate: number }) => {
      const dna = new DNASequence(sequence);
      const result = mutate(dna, mutationRate);

      return {
        original: sequence,
        mutated: result.sequence.sequence,
        mutations: result.mutations,
        mutationRate,
      };
    },

    transcribeDNA: (_: any, { sequence }: { sequence: string }) => {
      const dna = new DNASequence(sequence);
      const rna = transcribe(dna);

      return {
        dna: sequence,
        rna: rna.sequence,
        length: rna.length,
      };
    },

    translateRNA: (_: any, { sequence }: { sequence: string }) => {
      const dna = new DNASequence(sequence);
      const rna = transcribe(dna);
      const protein = translate(rna);

      return {
        dna: sequence,
        rna: rna.sequence,
        protein: protein.sequence,
        proteinLength: protein.length,
        molecularWeight: protein.getMolecularWeight(),
      };
    },

    buildTree: (_: any, { sequences }: { sequences: Array<{ id: string; name: string; sequence: string }> }) => {
      const seqObjects = sequences.map((s: any) => ({
        id: s.id,
        name: s.name,
        sequence: new DNASequence(s.sequence),
      }));

      const tree = neighborJoining(seqObjects, hammingDistanceDNA);
      const stats = tree.getStatistics();

      return {
        newick: tree.toNewick(),
        statistics: stats,
        nodeCount: tree.size,
        height: tree.height,
      };
    },

    buildGenome: (_: any, { template, genes }: { template?: string; genes?: Array<{ name: string; length: number; includePromoter?: boolean }> }) => {
      const builder = new GenomeBuilder('prokaryote');

      if (genes && genes.length > 0) {
        genes.forEach((gene: any) => {
          builder.addGene({
            name: gene.name,
            length: gene.length,
            includePromoter: gene.includePromoter || false,
          });
        });
      }

      const genome = builder.build();

      return {
        sequence: genome.sequence.sequence,
        annotations: genome.annotations || [],
        organism: genome.organism,
        statistics: genome.statistics,
      };
    },
  },
};

export default resolvers;
