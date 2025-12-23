/**
 * 📝 RNA Tests
 */

import { DNASequence } from '../src/dna/sequence.js';
import { transcribe } from '../src/rna/transcription.js';

console.log('📝 Testing RNA Module...\n');

const dna = new DNASequence('ATCG');
const rna = transcribe(dna);

console.assert(rna.sequence === 'AUCG', 'Transcription test');
console.assert(rna.length === 4, 'Length test');

console.log('✅ All RNA tests passed!');
