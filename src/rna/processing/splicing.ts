/**
 * ✂️ DIVINE KERNEL V12 - RNA Splicing
 */

import { mRNA } from '../types/mRNA.js';

export function splice(premRNA: mRNA, intronPositions: Array<[number, number]>): mRNA {
  let sequence = premRNA.sequence;
  
  // Sort introns in reverse order to remove from end to start
  const sortedIntrons = [...intronPositions].sort((a, b) => b[0] - a[0]);
  
  for (const [start, end] of sortedIntrons) {
    sequence = sequence.substring(0, start) + sequence.substring(end);
  }
  
  return new mRNA(sequence);
}

export function removeIntron(premRNA: mRNA, start: number, end: number): mRNA {
  const sequence = premRNA.sequence;
  const newSequence = sequence.substring(0, start) + sequence.substring(end);
  return new mRNA(newSequence);
}

export default {
  splice,
  removeIntron,
};
