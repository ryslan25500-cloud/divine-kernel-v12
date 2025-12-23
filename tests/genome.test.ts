/**
 * 🏗️ Genome Tests
 */

import { GenomeBuilder } from '../src/genome/synthetic/genome-builder.js';

console.log('🏗️ Testing Genome Module...\n');

const builder = new GenomeBuilder('prokaryote');
builder.addGene({ name: 'test', length: 300, includePromoter: true });

const genome = builder.build();

console.assert(genome.statistics.geneCount === 1, 'Gene count test');
console.assert(genome.sequence.length > 300, 'Length test');

console.log('✅ All Genome tests passed!');
