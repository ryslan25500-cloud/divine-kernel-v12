-- RSM Blockchain Database Schema

CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    block_index INTEGER UNIQUE NOT NULL,
    hash TEXT UNIQUE NOT NULL,
    previous_hash TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    nonce INTEGER NOT NULL,
    tx_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    block_index INTEGER REFERENCES blocks(block_index),
    tx_type TEXT DEFAULT 'TRANSFER',
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    amount NUMERIC(30, 0) NOT NULL,
    genome_id TEXT,
    consciousness INTEGER,
    signature TEXT,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
    address TEXT PRIMARY KEY,
    balance NUMERIC(30, 0) DEFAULT 0,
    tx_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tx_from ON transactions(from_address);
CREATE INDEX idx_tx_to ON transactions(to_address);
CREATE INDEX idx_tx_block ON transactions(block_index);
