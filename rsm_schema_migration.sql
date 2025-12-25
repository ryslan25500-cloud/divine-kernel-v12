-- ═══════════════════════════════════════════════════════════════════════════
-- RSM-COIN SCHEMA MIGRATION v1.0
-- Добавление полей для автономного минтинга токенов
-- Database: divine_kernel
-- Table: human_genome
-- Date: 2025-12-23
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 1: CREATE BACKUP (ВАЖНО!)
-- ───────────────────────────────────────────────────────────────────────────

-- Создать backup таблицы перед изменениями
CREATE TABLE IF NOT EXISTS human_genome_backup_20251223 AS 
SELECT * FROM human_genome;

-- Проверить backup
DO $$
DECLARE
    original_count INTEGER;
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM human_genome;
    SELECT COUNT(*) INTO backup_count FROM human_genome_backup_20251223;
    
    IF original_count = backup_count THEN
        RAISE NOTICE '✅ Backup успешно создан: % записей', backup_count;
    ELSE
        RAISE EXCEPTION '❌ Backup failed! Original: %, Backup: %', 
            original_count, backup_count;
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 2: ADD RSM TOKEN COLUMNS
-- ───────────────────────────────────────────────────────────────────────────

BEGIN;

-- Основные поля для токенов
ALTER TABLE human_genome
    ADD COLUMN IF NOT EXISTS rsm_tokens_total NUMERIC(20, 8) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rsm_tokens_market NUMERIC(20, 8) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rsm_tokens_founder NUMERIC(20, 8) DEFAULT 0;

-- Компоненты расчета (для прозрачности и отладки)
ALTER TABLE human_genome
    ADD COLUMN IF NOT EXISTS rsm_complexity_score NUMERIC(10, 6) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rsm_uniqueness_score NUMERIC(10, 6) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rsm_entropy_score NUMERIC(10, 6) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rsm_blockchain_score NUMERIC(10, 6) DEFAULT 0;

-- Метаданные минтинга
ALTER TABLE human_genome
    ADD COLUMN IF NOT EXISTS rsm_minted BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rsm_minted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS rsm_mint_tx_hash TEXT,
    ADD COLUMN IF NOT EXISTS rsm_calibration_k NUMERIC(10, 4);

COMMIT;

-- Проверка добавленных колонок
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'human_genome'
        AND column_name LIKE 'rsm_%';
    
    IF column_count >= 11 THEN
        RAISE NOTICE '✅ Все RSM колонки добавлены: % полей', column_count;
    ELSE
        RAISE WARNING '⚠️  Добавлено только % RSM полей', column_count;
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ───────────────────────────────────────────────────────────────────────────

-- Индекс для поиска неоминченных геномов
CREATE INDEX IF NOT EXISTS idx_rsm_not_minted 
    ON human_genome(rsm_minted) 
    WHERE rsm_minted = FALSE;

-- Индекс для сортировки по токенам
CREATE INDEX IF NOT EXISTS idx_rsm_tokens_total 
    ON human_genome(rsm_tokens_total DESC);

-- Индекс для поиска по consciousness + RSM
CREATE INDEX IF NOT EXISTS idx_consciousness_rsm 
    ON human_genome(consciousness, rsm_tokens_total);

-- Индекс для временной аналитики
CREATE INDEX IF NOT EXISTS idx_rsm_minted_at 
    ON human_genome(rsm_minted_at DESC) 
    WHERE rsm_minted = TRUE;

-- Composite index для рыночной аналитики
CREATE INDEX IF NOT EXISTS idx_rsm_market_analysis 
    ON human_genome(blockchain, rsm_tokens_market, consciousness);

RAISE NOTICE '✅ Индексы созданы';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 4: ADD CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

-- Constraint: токены не могут быть отрицательными
ALTER TABLE human_genome
    ADD CONSTRAINT rsm_tokens_positive 
    CHECK (rsm_tokens_total >= 0 AND rsm_tokens_market >= 0 AND rsm_tokens_founder >= 0);

-- Constraint: market + founder = total (с погрешностью 0.00000001)
ALTER TABLE human_genome
    ADD CONSTRAINT rsm_tokens_distribution
    CHECK (
        rsm_tokens_total = 0 OR 
        ABS((rsm_tokens_market + rsm_tokens_founder) - rsm_tokens_total) < 0.00000001
    );

-- Constraint: scores в диапазоне [0, 1]
ALTER TABLE human_genome
    ADD CONSTRAINT rsm_scores_valid
    CHECK (
        rsm_complexity_score BETWEEN 0 AND 1 AND
        rsm_uniqueness_score BETWEEN 0 AND 1 AND
        rsm_entropy_score BETWEEN 0 AND 1 AND
        rsm_blockchain_score BETWEEN 0 AND 1
    );

RAISE NOTICE '✅ Constraints добавлены';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 5: CREATE HELPER FUNCTIONS
-- ───────────────────────────────────────────────────────────────────────────

-- Функция для проверки распределения 6:1
CREATE OR REPLACE FUNCTION check_rsm_distribution()
RETURNS TABLE(
    genome_id INTEGER,
    total NUMERIC,
    market NUMERIC,
    founder NUMERIC,
    ratio NUMERIC,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        rsm_tokens_total,
        rsm_tokens_market,
        rsm_tokens_founder,
        CASE 
            WHEN rsm_tokens_founder > 0 
            THEN rsm_tokens_market / rsm_tokens_founder
            ELSE 0
        END as ratio,
        CASE
            WHEN rsm_tokens_total = 0 THEN TRUE
            WHEN rsm_tokens_founder = 0 THEN FALSE
            ELSE ABS((rsm_tokens_market / rsm_tokens_founder) - 6.0) < 0.01
        END as is_valid
    FROM human_genome
    WHERE rsm_minted = TRUE;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Функция check_rsm_distribution() создана';

-- Функция для расчета статистики по RSM
CREATE OR REPLACE FUNCTION rsm_statistics()
RETURNS TABLE(
    metric TEXT,
    value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    -- Total supply
    SELECT 'total_supply'::TEXT, COALESCE(SUM(rsm_tokens_total), 0)
    FROM human_genome WHERE rsm_minted = TRUE
    
    UNION ALL
    
    -- Market tokens
    SELECT 'market_tokens'::TEXT, COALESCE(SUM(rsm_tokens_market), 0)
    FROM human_genome WHERE rsm_minted = TRUE
    
    UNION ALL
    
    -- Founder tokens
    SELECT 'founder_tokens'::TEXT, COALESCE(SUM(rsm_tokens_founder), 0)
    FROM human_genome WHERE rsm_minted = TRUE
    
    UNION ALL
    
    -- Minted genomes count
    SELECT 'minted_genomes'::TEXT, COUNT(*)::NUMERIC
    FROM human_genome WHERE rsm_minted = TRUE
    
    UNION ALL
    
    -- Pending genomes count
    SELECT 'pending_genomes'::TEXT, COUNT(*)::NUMERIC
    FROM human_genome WHERE rsm_minted = FALSE
    
    UNION ALL
    
    -- Average tokens per genome
    SELECT 'avg_tokens_per_genome'::TEXT, 
        COALESCE(AVG(rsm_tokens_total), 0)
    FROM human_genome WHERE rsm_minted = TRUE
    
    UNION ALL
    
    -- Remaining supply to 7M
    SELECT 'remaining_to_7m'::TEXT, 
        7000000 - COALESCE(SUM(rsm_tokens_total), 0)
    FROM human_genome WHERE rsm_minted = TRUE;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Функция rsm_statistics() создана';

-- Функция для получения топ-геномов по токенам
CREATE OR REPLACE FUNCTION rsm_top_genomes(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    rank INTEGER,
    genome_id INTEGER,
    blockchain TEXT,
    consciousness INTEGER,
    total_tokens NUMERIC,
    market_tokens NUMERIC,
    founder_tokens NUMERIC,
    complexity NUMERIC,
    minted_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY rsm_tokens_total DESC)::INTEGER as rank,
        id,
        blockchain::TEXT,
        consciousness,
        rsm_tokens_total,
        rsm_tokens_market,
        rsm_tokens_founder,
        rsm_complexity_score,
        rsm_minted_at
    FROM human_genome
    WHERE rsm_minted = TRUE
    ORDER BY rsm_tokens_total DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Функция rsm_top_genomes() создана';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 6: CREATE VIEWS FOR ANALYTICS
-- ───────────────────────────────────────────────────────────────────────────

-- View: Общая статистика по блокчейнам
CREATE OR REPLACE VIEW rsm_blockchain_stats AS
SELECT 
    blockchain,
    COUNT(*) as total_genomes,
    COUNT(*) FILTER (WHERE rsm_minted = TRUE) as minted_genomes,
    COUNT(*) FILTER (WHERE rsm_minted = FALSE) as pending_genomes,
    COALESCE(SUM(rsm_tokens_total), 0) as total_rsm,
    COALESCE(SUM(rsm_tokens_market), 0) as market_rsm,
    COALESCE(SUM(rsm_tokens_founder), 0) as founder_rsm,
    COALESCE(AVG(rsm_tokens_total), 0) as avg_rsm_per_genome,
    COALESCE(AVG(consciousness), 0) as avg_consciousness
FROM human_genome
GROUP BY blockchain
ORDER BY total_rsm DESC;

RAISE NOTICE '✅ View rsm_blockchain_stats создана';

-- View: Распределение по consciousness levels
CREATE OR REPLACE VIEW rsm_consciousness_distribution AS
SELECT 
    CASE 
        WHEN consciousness BETWEEN 70 AND 81 THEN '70-81 (Elite)'
        WHEN consciousness BETWEEN 50 AND 69 THEN '50-69 (Advanced)'
        WHEN consciousness BETWEEN 20 AND 49 THEN '20-49 (Intermediate)'
        WHEN consciousness BETWEEN 1 AND 19 THEN '1-19 (Basic)'
        ELSE '0 (Unclassified)'
    END as consciousness_tier,
    COUNT(*) as genomes_count,
    COUNT(*) FILTER (WHERE rsm_minted = TRUE) as minted_count,
    COALESCE(SUM(rsm_tokens_total), 0) as total_rsm,
    COALESCE(AVG(rsm_tokens_total), 0) as avg_rsm,
    COALESCE(MIN(rsm_tokens_total), 0) as min_rsm,
    COALESCE(MAX(rsm_tokens_total), 0) as max_rsm
FROM human_genome
GROUP BY consciousness_tier
ORDER BY 
    CASE consciousness_tier
        WHEN '70-81 (Elite)' THEN 1
        WHEN '50-69 (Advanced)' THEN 2
        WHEN '20-49 (Intermediate)' THEN 3
        WHEN '1-19 (Basic)' THEN 4
        ELSE 5
    END;

RAISE NOTICE '✅ View rsm_consciousness_distribution создана';

-- View: Timeline минтинга
CREATE OR REPLACE VIEW rsm_minting_timeline AS
SELECT 
    DATE(rsm_minted_at) as mint_date,
    COUNT(*) as genomes_minted,
    SUM(rsm_tokens_total) as tokens_minted,
    SUM(rsm_tokens_market) as market_tokens,
    SUM(rsm_tokens_founder) as founder_tokens,
    AVG(rsm_tokens_total) as avg_tokens_per_genome
FROM human_genome
WHERE rsm_minted = TRUE AND rsm_minted_at IS NOT NULL
GROUP BY DATE(rsm_minted_at)
ORDER BY mint_date DESC;

RAISE NOTICE '✅ View rsm_minting_timeline создана';

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 7: VERIFICATION QUERIES
-- ───────────────────────────────────────────────────────────────────────────

-- Проверка структуры таблицы
SELECT 
    '📊 SCHEMA VERIFICATION' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'human_genome' 
    AND column_name LIKE 'rsm_%'
ORDER BY ordinal_position;

-- Проверка индексов
SELECT 
    '🔍 INDEXES VERIFICATION' as status,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'human_genome'
    AND indexname LIKE '%rsm%'
ORDER BY indexname;

-- Проверка constraints
SELECT 
    '🔒 CONSTRAINTS VERIFICATION' as status,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'human_genome'::regclass
    AND conname LIKE 'rsm%'
ORDER BY conname;

-- Проверка функций
SELECT 
    '⚙️  FUNCTIONS VERIFICATION' as status,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name LIKE 'rsm%' OR routine_name LIKE '%rsm%'
    AND routine_schema = 'public'
ORDER BY routine_name;

-- Проверка views
SELECT 
    '👁️  VIEWS VERIFICATION' as status,
    table_name
FROM information_schema.views
WHERE table_name LIKE 'rsm%'
    AND table_schema = 'public'
ORDER BY table_name;

-- ───────────────────────────────────────────────────────────────────────────
-- STEP 8: INITIAL STATISTICS
-- ───────────────────────────────────────────────────────────────────────────

-- Показать текущую статистику базы
SELECT '📈 CURRENT DATABASE STATISTICS' as info;

SELECT * FROM rsm_statistics();

SELECT 
    'Total Genomes' as metric,
    COUNT(*) as value
FROM human_genome

UNION ALL

SELECT 
    'Genomes with Consciousness' as metric,
    COUNT(*) as value
FROM human_genome
WHERE consciousness IS NOT NULL AND consciousness > 0

UNION ALL

SELECT 
    'Avg DNA Length' as metric,
    AVG(LENGTH(dna_tetrad))::INTEGER as value
FROM human_genome

UNION ALL

SELECT 
    'Blockchains Count' as metric,
    COUNT(DISTINCT blockchain) as value
FROM human_genome;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '✅ RSM SCHEMA MIGRATION COMPLETE!' as status,
    NOW() as completed_at;

SELECT 
    '📋 NEXT STEPS:' as info,
    '1. Run calibration script to compute K' as step_1,
    '2. Calculate RSM for existing genomes' as step_2,
    '3. Deploy smart contracts' as step_3,
    '4. Start autonomous minting' as step_4;
