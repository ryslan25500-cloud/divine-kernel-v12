/**
 * ⛓️ DIVINE KERNEL V12 - Blockchain to DNA Encoding (Fixed)
 */

import { DNASequence } from '../sequence.js';
import {
  HEX_TO_NUCLEOTIDE,
  BLOCKCHAINS,
  type BlockchainType,
} from '../../core/config/constants.js';

export function hashToDNA(hash: string): DNASequence {
  let dna = '';
  
  for (const char of hash.toLowerCase()) {
    if (char in HEX_TO_NUCLEOTIDE) {
      dna += HEX_TO_NUCLEOTIDE[char];
    }
  }
  
  return new DNASequence(dna);
}

export function blockchainToDNA(
  blockchain: BlockchainType,
  blockHash: string
): DNASequence {
  const prefix = blockchain === BLOCKCHAINS.BITCOIN ? 'BTC' :
                 blockchain === BLOCKCHAINS.ETHEREUM ? 'ETH' :
                 'SOL';
  
  const dna = hashToDNA(blockHash);
  return dna;
}

export function encodeBitcoinBlock(blockHash: string): DNASequence {
  return hashToDNA(blockHash);
}

export function encodeEthereumBlock(blockHash: string): DNASequence {
  return hashToDNA(blockHash);
}

export function encodeSolanaBlock(blockHash: string): DNASequence {
  return hashToDNA(blockHash);
}

export default {
  hashToDNA,
  blockchainToDNA,
  encodeBitcoinBlock,
  encodeEthereumBlock,
  encodeSolanaBlock,
};
