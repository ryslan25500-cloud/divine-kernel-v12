/**
 * 🧬 DNA Tests
 */

import { DNASequence } from '../src/dna/sequence.js';
import { generateRandom } from '../src/dna/generator.js';

console.log('🧬 Testing DNA Module...\n');

// Test 1: DNA Creation
const dna = new DNASequence('ATCG');
console.assert(dna.length === 4, 'Length test');
console.assert(dna.gcContent === 0.5, 'GC content test');

// Test 2: Generation
const generated = generateRandom(100);
console.assert(generated.length === 100, 'Generation test');

// Test 3: Complement
const complement = dna.complement();
console.assert(complement.sequence === 'TAGC', 'Complement test');

console.log('✅ All DNA tests passed!');
