/**
 * 🌐 DIVINE KERNEL V12 - GraphQL Schema
 */

export const typeDefs = `
  type Query {
    health: String!
    analyzeDNA(sequence: String!): DNAAnalysis
    findORFs(sequence: String!, minLength: Int): [ORF]
    findGenes(sequence: String!, minLength: Int): GeneFinderResult
    systemStats: SystemStats
  }

  type Mutation {
    generateDNA(length: Int!, gcContent: Float): DNASequence
    mutateDNA(sequence: String!, mutationRate: Float!): MutationResult
    transcribeDNA(sequence: String!): TranscriptionResult
    translateRNA(sequence: String!): TranslationResult
    buildTree(sequences: [SequenceInput!]!): PhylogeneticTree
    buildGenome(template: String, genes: [GeneInput]): SyntheticGenome
  }

  type DNASequence {
    sequence: String!
    length: Int!
    gcContent: Float!
  }

  type DNAAnalysis {
    length: Int!
    gcContent: Float!
    nucleotideCounts: NucleotideCounts!
    orfs: [ORF]
    statistics: SequenceStatistics!
  }

  type NucleotideCounts {
    A: Int!
    G: Int!
    C: Int!
    T: Int!
  }

  type SequenceStatistics {
    length: Int!
    gcContent: Float!
    atContent: Float!
    nucleotideCounts: NucleotideCounts!
    isRealistic: Boolean!
    isOptimalGC: Boolean!
  }

  type ORF {
    start: Int!
    end: Int!
    length: Int!
    strand: String!
    frame: Int!
    sequence: String!
  }

  type GeneFinderResult {
    geneCount: Int!
    genes: [Gene]
  }

  type Gene {
    id: String!
    start: Int!
    end: Int!
    length: Int!
    strand: String!
    frame: Int!
    sequence: String!
    gcContent: Float!
    hasPromoter: Boolean!
    hasShineDalgarno: Boolean!
  }

  type MutationResult {
    original: String!
    mutated: String!
    mutations: [Mutation]
    mutationRate: Float!
  }

  type Mutation {
    type: String!
    position: Int!
    original: String
    mutated: String
  }

  type TranscriptionResult {
    dna: String!
    rna: String!
    length: Int!
  }

  type TranslationResult {
    dna: String!
    rna: String!
    protein: String!
    proteinLength: Int!
    molecularWeight: Float!
  }

  type PhylogeneticTree {
    newick: String!
    statistics: TreeStatistics!
    nodeCount: Int!
    height: Int!
  }

  type TreeStatistics {
    totalNodes: Int!
    leaves: Int!
    internalNodes: Int!
    height: Int!
    averageBranchLength: Float!
    totalBranchLength: Float!
    isBinary: Boolean!
    isBalanced: Boolean!
  }

  type SyntheticGenome {
    sequence: String!
    annotations: [Annotation]
    organism: String!
    statistics: GenomeStatistics!
  }

  type Annotation {
    type: String!
    start: Int!
    end: Int!
    name: String
  }

  type GenomeStatistics {
    geneCount: Int!
    codingDensity: Float!
  }

  type SystemStats {
    version: String!
    modules: ModuleStatus!
    capabilities: [String]
  }

  type ModuleStatus {
    dna: String!
    rna: String!
    tree: String!
    genome: String!
  }

  input SequenceInput {
    id: String!
    name: String!
    sequence: String!
  }

  input GeneInput {
    name: String!
    length: Int!
    includePromoter: Boolean
  }
`;

export default typeDefs;
