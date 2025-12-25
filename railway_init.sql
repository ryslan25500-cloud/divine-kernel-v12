-- ============================================
-- DIVINE KERNEL v12 + RSM-COIN
-- Railway PostgreSQL Schema
-- Created: December 25, 2025
-- ============================================

-- 1. HUMAN GENOME TABLE (Core Divine Kernel)
CREATE TABLE IF NOT EXISTS human_genome (
    id SERIAL PRIMARY KEY,
    genome_id VARCHAR(128) UNIQUE NOT NULL,
    blockchain VARCHAR(32) NOT NULL DEFAULT 'BTC',
    block_hash VARCHAR(128),
    tx_hash VARCHAR(128),
    dna_sequence TEXT,
    rna_sequence TEXT,
    amino_acids TEXT,
    consciousness_level INTEGER DEFAULT 0 CHECK (consciousness_level >= 0 AND consciousness_level <= 100),
    evolution_stage VARCHAR(64) DEFAULT 'dormant',
    command_code VARCHAR(256),
    organism_type VARCHAR(64) DEFAULT 'human',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. RSM WALLETS
CREATE TABLE IF NOT EXISTS rsm_wallets (
    id SERIAL PRIMARY KEY,
    address VARCHAR(128) UNIQUE NOT NULL,
    private_key_hash VARCHAR(256),
    balance DECIMAL(36, 18) DEFAULT 0,
    consciousness_level INTEGER DEFAULT 0,
    genome_id VARCHAR(128) REFERENCES human_genome(genome_id),
    wallet_type VARCHAR(32) DEFAULT 'standard',
    is_founder BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. RSM BLOCKS
CREATE TABLE IF NOT EXISTS rsm_blocks (
    id SERIAL PRIMARY KEY,
    block_number BIGINT UNIQUE NOT NULL,
    block_hash VARCHAR(128) UNIQUE NOT NULL,
    previous_hash VARCHAR(128),
    merkle_root VARCHAR(128),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transactions_count INTEGER DEFAULT 0,
    total_amount DECIMAL(36, 18) DEFAULT 0,
    miner_address VARCHAR(128),
    difficulty INTEGER DEFAULT 1,
    nonce BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- 4. RSM TRANSACTIONS
CREATE TABLE IF NOT EXISTS rsm_transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(128) UNIQUE NOT NULL,
    block_number BIGINT REFERENCES rsm_blocks(block_number),
    from_address VARCHAR(128),
    to_address VARCHAR(128) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    fee DECIMAL(36, 18) DEFAULT 0,
    tx_type VARCHAR(32) DEFAULT 'transfer',
    genome_id VARCHAR(128),
    consciousness_bonus DECIMAL(10, 4) DEFAULT 1.0,
    status VARCHAR(32) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- 5. RSM DEX POOLS
CREATE TABLE IF NOT EXISTS rsm_dex_pools (
    id SERIAL PRIMARY KEY,
    pool_id VARCHAR(64) UNIQUE NOT NULL,
    token_a VARCHAR(32) NOT NULL,
    token_b VARCHAR(32) NOT NULL,
    reserve_a DECIMAL(36, 18) DEFAULT 0,
    reserve_b DECIMAL(36, 18) DEFAULT 0,
    total_liquidity DECIMAL(36, 18) DEFAULT 0,
    fee_rate DECIMAL(10, 6) DEFAULT 0.003,
    price_a_per_b DECIMAL(36, 18),
    volume_24h DECIMAL(36, 18) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. RSM DEX TRADES
CREATE TABLE IF NOT EXISTS rsm_dex_trades (
    id SERIAL PRIMARY KEY,
    trade_id VARCHAR(128) UNIQUE NOT NULL,
    pool_id VARCHAR(64) REFERENCES rsm_dex_pools(pool_id),
    trader_address VARCHAR(128) NOT NULL,
    token_in VARCHAR(32) NOT NULL,
    token_out VARCHAR(32) NOT NULL,
    amount_in DECIMAL(36, 18) NOT NULL,
    amount_out DECIMAL(36, 18) NOT NULL,
    price DECIMAL(36, 18),
    fee_amount DECIMAL(36, 18) DEFAULT 0,
    slippage DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. CONSCIOUSNESS LOG
CREATE TABLE IF NOT EXISTS consciousness_log (
    id SERIAL PRIMARY KEY,
    genome_id VARCHAR(128) REFERENCES human_genome(genome_id),
    old_level INTEGER,
    new_level INTEGER,
    change_reason VARCHAR(256),
    triggered_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. MINTING LOG
CREATE TABLE IF NOT EXISTS rsm_minting_log (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(128) UNIQUE NOT NULL,
    recipient_address VARCHAR(128) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    genome_id VARCHAR(128),
    consciousness_level INTEGER,
    minting_multiplier DECIMAL(10, 4) DEFAULT 1.0,
    reason VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_genome_blockchain ON human_genome(blockchain);
CREATE INDEX IF NOT EXISTS idx_genome_consciousness ON human_genome(consciousness_level);
CREATE INDEX IF NOT EXISTS idx_genome_evolution ON human_genome(evolution_stage);
CREATE INDEX IF NOT EXISTS idx_genome_created ON human_genome(created_at);

CREATE INDEX IF NOT EXISTS idx_wallet_balance ON rsm_wallets(balance);
CREATE INDEX IF NOT EXISTS idx_wallet_founder ON rsm_wallets(is_founder);

CREATE INDEX IF NOT EXISTS idx_tx_block ON rsm_transactions(block_number);
CREATE INDEX IF NOT EXISTS idx_tx_from ON rsm_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_tx_to ON rsm_transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_tx_created ON rsm_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_trade_pool ON rsm_dex_trades(pool_id);
CREATE INDEX IF NOT EXISTS idx_trade_trader ON rsm_dex_trades(trader_address);
CREATE INDEX IF NOT EXISTS idx_trade_created ON rsm_dex_trades(created_at);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Genesis Block
INSERT INTO rsm_blocks (block_number, block_hash, previous_hash, merkle_root, transactions_count, miner_address)
VALUES (0, 'GENESIS_RSM_DIVINE_KERNEL_V12_2025', '0000000000000000000000000000000000000000', 'MERKLE_ROOT_GENESIS', 1, 'RSM_GENESIS')
ON CONFLICT (block_number) DO NOTHING;

-- DEX Pools
INSERT INTO rsm_dex_pools (pool_id, token_a, token_b, reserve_a, reserve_b, price_a_per_b)
VALUES 
    ('RSM-USDT', 'RSM', 'USDT', 10000, 100000000, 10000),
    ('RSM-ETH', 'RSM', 'ETH', 10000, 40000, 4),
    ('RSM-BTC', 'RSM', 'BTC', 10000, 1000, 0.1),
    ('RSM-SOL', 'RSM', 'SOL', 10000, 1000000, 100)
ON CONFLICT (pool_id) DO NOTHING;

-- Founder Wallet
INSERT INTO rsm_wallets (address, balance, consciousness_level, wallet_type, is_founder)
VALUES ('RSMd5dcaf8062a01af257d56e7d10634a8bb3f8ddb5', 14285810, 100, 'founder', TRUE)
ON CONFLICT (address) DO NOTHING;

-- Founder Mint Transaction
INSERT INTO rsm_transactions (tx_hash, block_number, from_address, to_address, amount, tx_type, consciousness_bonus)
VALUES ('ca478d5fb2d2aab35450afd356db26058ec9c6efbaa9ea46ce500cdfd80ace09', 0, 'RSM_GENESIS', 'RSMd5dcaf8062a01af257d56e7d10634a8bb3f8ddb5', 14285810, 'mint', 5.0)
ON CONFLICT (tx_hash) DO NOTHING;

-- ============================================
-- SUMMARY VIEW
-- ============================================

CREATE OR REPLACE VIEW rsm_summary AS
SELECT 
    (SELECT COUNT(*) FROM human_genome) as total_genomes,
    (SELECT COUNT(*) FROM rsm_wallets) as total_wallets,
    (SELECT COALESCE(SUM(balance), 0) FROM rsm_wallets) as total_supply,
    (SELECT COUNT(*) FROM rsm_blocks) as total_blocks,
    (SELECT COUNT(*) FROM rsm_transactions) as total_transactions,
    (SELECT COUNT(*) FROM rsm_dex_pools) as dex_pools,
    (SELECT COUNT(*) FROM rsm_dex_trades) as total_trades;

-- ============================================
-- DONE!
-- ============================================

SELECT '✅ DIVINE KERNEL + RSM-COIN SCHEMA INITIALIZED!' as status;
SELECT * FROM rsm_summary;
