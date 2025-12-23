module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@dna/(.*)$': '<rootDir>/src/dna/$1',
    '^@rna/(.*)$': '<rootDir>/src/rna/$1',
    '^@tree/(.*)$': '<rootDir>/src/tree/$1',
    '^@genome/(.*)$': '<rootDir>/src/genome/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};
