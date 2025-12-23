/**
 * 📝 DIVINE KERNEL V12 - Transcription
 */

import { DNASequence } from '../dna/sequence.js';
import { RNASequence } from './types/rna-sequence.js';

export function transcribe(dna: DNASequence): RNASequence {
  const rnaSeq = dna.sequence.replace(/T/g, 'U');
  return new RNASequence(rnaSeq);
}

export function reverseTranscribe(rna: RNASequence): DNASequence {
  const dnaSeq = rna.sequence.replace(/U/g, 'T');
  return new DNASequence(dnaSeq);
}

export default {
  transcribe,
  reverseTranscribe,
};
