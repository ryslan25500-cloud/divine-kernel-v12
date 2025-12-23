# 🧬 Divine Kernel V12

Advanced bioinformatics toolkit for DNA/RNA analysis, phylogenetic trees, and synthetic genome construction.

## Features

- 🧬 **DNA Module**: Sequence analysis, generation, mutations
- 📝 **RNA Module**: Transcription, translation, splicing
- 🌳 **Tree Module**: Phylogenetic tree building (NJ algorithm)
- 🏗️ **Genome Module**: Synthetic genome construction
- 🌐 **API**: REST & GraphQL APIs
- 🗄️ **Database**: PostgreSQL support

## Installation
```bash
npm install
npm run setup:db
npm run migrate up
```

## Usage
```typescript
import { DNASequence } from './src/dna/sequence.js';

const dna = new DNASequence('ATCGATCG');
console.log(dna.gcContent); // 0.5
```

## API

Start server:
```bash
npm start
```

Endpoints:
- `GET /api/health` - Health check
- `POST /api/dna/generate` - Generate DNA
- `POST /api/tree/build` - Build tree

## Scripts

- `npm run setup:db` - Setup database
- `npm run migrate` - Run migrations
- `npm run backup` - Backup database
- `npm run cleanup` - Cleanup old data

## License

MIT
