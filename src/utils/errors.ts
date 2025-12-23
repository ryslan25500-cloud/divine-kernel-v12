/**
 * ❌ DIVINE KERNEL V12 - Custom Errors
 * 
 * Типизированные ошибки для разных частей системы.
 * Упрощают обработку и отладку.
 */

// ═══════════════════════════════════════════════════════════
// 🎯 BASE ERROR CLASS
// ═══════════════════════════════════════════════════════════

export class DivineKernelError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'DivineKernelError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ═══════════════════════════════════════════════════════════
// 💾 DATABASE ERRORS
// ═══════════════════════════════════════════════════════════

export class DatabaseError extends DivineKernelError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string = 'Failed to connect to database') {
    super(message);
    this.name = 'DatabaseConnectionError';
    this.code = 'DB_CONNECTION_ERROR';
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(query: string, originalError?: Error) {
    super(`Query failed: ${query}`, originalError);
    this.name = 'DatabaseQueryError';
    this.code = 'DB_QUERY_ERROR';
  }
}

// ═══════════════════════════════════════════════════════════
// 🧬 DNA ERRORS
// ═══════════════════════════════════════════════════════════

export class DNAError extends DivineKernelError {
  constructor(message: string) {
    super(message, 'DNA_ERROR', 400);
    this.name = 'DNAError';
  }
}

export class InvalidSequenceError extends DNAError {
  constructor(sequence: string, reason: string) {
    super(`Invalid DNA sequence: ${reason}\nSequence: ${sequence.substring(0, 50)}...`);
    this.name = 'InvalidSequenceError';
    this.code = 'INVALID_SEQUENCE';
  }
}

export class SequenceTooLongError extends DNAError {
  constructor(length: number, maxLength: number) {
    super(`Sequence too long: ${length} bp (max: ${maxLength} bp)`);
    this.name = 'SequenceTooLongError';
    this.code = 'SEQUENCE_TOO_LONG';
  }
}

export class SequenceTooShortError extends DNAError {
  constructor(length: number, minLength: number) {
    super(`Sequence too short: ${length} bp (min: ${minLength} bp)`);
    this.name = 'SequenceTooShortError';
    this.code = 'SEQUENCE_TOO_SHORT';
  }
}

// ═══════════════════════════════════════════════════════════
// 📝 RNA ERRORS
// ═══════════════════════════════════════════════════════════

export class RNAError extends DivineKernelError {
  constructor(message: string) {
    super(message, 'RNA_ERROR', 400);
    this.name = 'RNAError';
  }
}

export class TranscriptionError extends RNAError {
  constructor(reason: string) {
    super(`Transcription failed: ${reason}`);
    this.name = 'TranscriptionError';
    this.code = 'TRANSCRIPTION_ERROR';
  }
}

export class TranslationError extends RNAError {
  constructor(reason: string) {
    super(`Translation failed: ${reason}`);
    this.name = 'TranslationError';
    this.code = 'TRANSLATION_ERROR';
  }
}

// ═══════════════════════════════════════════════════════════
// 🌳 TREE ERRORS
// ═══════════════════════════════════════════════════════════

export class TreeError extends DivineKernelError {
  constructor(message: string) {
    super(message, 'TREE_ERROR', 400);
    this.name = 'TreeError';
  }
}

export class InsufficientDataError extends TreeError {
  constructor(required: number, actual: number) {
    super(`Insufficient data for tree: need ${required}, got ${actual}`);
    this.name = 'InsufficientDataError';
    this.code = 'INSUFFICIENT_DATA';
  }
}

// ═══════════════════════════════════════════════════════════
// 🔗 BLOCKCHAIN ERRORS
// ═══════════════════════════════════════════════════════════

export class BlockchainError extends DivineKernelError {
  constructor(message: string, chain: string) {
    super(`[${chain}] ${message}`, 'BLOCKCHAIN_ERROR', 500);
    this.name = 'BlockchainError';
  }
}

export class BlockchainConnectionError extends BlockchainError {
  constructor(chain: string, url: string) {
    super(`Failed to connect to ${url}`, chain);
    this.name = 'BlockchainConnectionError';
    this.code = 'BLOCKCHAIN_CONNECTION_ERROR';
  }
}

export class BlockNotFoundError extends BlockchainError {
  constructor(chain: string, blockNumber: number) {
    super(`Block ${blockNumber} not found`, chain);
    this.name = 'BlockNotFoundError';
    this.code = 'BLOCK_NOT_FOUND';
    this.statusCode = 404;
  }
}

// ═══════════════════════════════════════════════════════════
// 📥 GENOME IMPORT ERRORS
// ═══════════════════════════════════════════════════════════

export class GenomeImportError extends DivineKernelError {
  constructor(message: string) {
    super(message, 'GENOME_IMPORT_ERROR', 500);
    this.name = 'GenomeImportError';
  }
}

export class ParseError extends GenomeImportError {
  constructor(format: string, reason: string) {
    super(`Failed to parse ${format}: ${reason}`);
    this.name = 'ParseError';
    this.code = 'PARSE_ERROR';
  }
}

export class ExternalAPIError extends GenomeImportError {
  constructor(api: string, statusCode: number, message: string) {
    super(`${api} API error (${statusCode}): ${message}`);
    this.name = 'ExternalAPIError';
    this.code = 'EXTERNAL_API_ERROR';
    this.statusCode = statusCode;
  }
}

// ═══════════════════════════════════════════════════════════
// 🌐 API ERRORS
// ═══════════════════════════════════════════════════════════

export class APIError extends DivineKernelError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'API_ERROR', statusCode);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(field: string, reason: string) {
    super(`Validation failed for ${field}: ${reason}`, 400);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string, id: string | number) {
    super(`${resource} not found: ${id}`, 404);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
  }
}

export class RateLimitError extends APIError {
  constructor(limit: number, window: string) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`, 429);
    this.name = 'RateLimitError';
    this.code = 'RATE_LIMIT_EXCEEDED';
  }
}

// ═══════════════════════════════════════════════════════════
// 🔧 UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

export function isKnownError(error: unknown): error is DivineKernelError {
  return error instanceof DivineKernelError;
}

export function getErrorResponse(error: unknown) {
  if (isKnownError(error)) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
    };
  }
  
  // Unknown error
  return {
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  };
}

export default {
  DivineKernelError,
  DatabaseError,
  DatabaseConnectionError,
  DatabaseQueryError,
  DNAError,
  InvalidSequenceError,
  SequenceTooLongError,
  SequenceTooShortError,
  RNAError,
  TranscriptionError,
  TranslationError,
  TreeError,
  InsufficientDataError,
  BlockchainError,
  BlockchainConnectionError,
  BlockNotFoundError,
  GenomeImportError,
  ParseError,
  ExternalAPIError,
  APIError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  isKnownError,
  getErrorResponse,
};
