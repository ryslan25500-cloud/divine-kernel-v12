/**
 * RSM-COIN AGI MINTING ENGINE v2.1
 * Fixed: rsm_tokens_distribution constraint
 */

const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
const { Pool } = require('pg');
const fs = require('fs');

const CONFIG = {
    SOLANA_RPC: 'https://api.devnet.solana.com',
    TOKEN_MINT: '62zfath9o7eeq8TgxJGkChmEiJnWVWYUhv1wKfCUtZZg',
    WALLET_PATH: process.env.HOME + '/.config/solana/id.json',
    
    DB: {
        host: '127.0.0.1',
        port: 5432,
        database: 'divine_kernel',
        user: 'divine_user',
        password: '2480'
    },
    
    AGI: {
        BASE_MULTIPLIER: 1_000_000_000,
        MARKET_SHARE: 0.85,
        FOUNDER_SHARE: 0.15
    }
};

function calculateAGIReward(genome) {
    const complexity = Number(genome.rsm_complexity_score || 0) * 100;
    const uniqueness = Number(genome.rsm_uniqueness_score || 0) * 100;
    const entropy = Number(genome.rsm_entropy_score || 0) * 100;
    const consciousness = genome.consciousness || 50;
    
    const weightedScore = (complexity * 40) + (uniqueness * 30) + (entropy * 20) + (consciousness * 10);
    let amount = Math.floor((weightedScore * CONFIG.AGI.BASE_MULTIPLIER) / 100);
    
    if (amount < 100_000_000) amount = 100_000_000;
    
    if (consciousness >= 90) amount = Math.floor(amount * 1.5);
    else if (consciousness >= 70) amount = Math.floor(amount * 1.25);
    
    return BigInt(amount);
}

class DivineKernelDB {
    constructor() {
        this.pool = new Pool(CONFIG.DB);
    }
    
    async getUnrewardedGenomes(limit = 5) {
        const query = `
            SELECT id, block_hash, consciousness, command, 
                   blockchain, block_height,
                   rsm_complexity_score, rsm_uniqueness_score,
                   rsm_entropy_score, rsm_blockchain_score
            FROM human_genome 
            WHERE (rsm_rewarded = false OR rsm_rewarded IS NULL)
              AND rsm_minted = false
            ORDER BY consciousness DESC NULLS LAST
            LIMIT $1
        `;
        const result = await this.pool.query(query, [limit]);
        return result.rows;
    }
    
    async markAsRewarded(id, txSignature, amount) {
        const amountRSM = Number(amount) / 1_000_000_000;
        const marketShare = amountRSM * CONFIG.AGI.MARKET_SHARE;
        const founderShare = amountRSM * CONFIG.AGI.FOUNDER_SHARE;
        
        const query = `
            UPDATE human_genome 
            SET rsm_rewarded = true,
                rsm_tx_signature = $2,
                rsm_amount = $3,
                rsm_rewarded_at = NOW(),
                rsm_minted = true,
                rsm_minted_at = NOW(),
                rsm_mint_tx_hash = $2,
                rsm_tokens_total = $4,
                rsm_tokens_market = $5,
                rsm_tokens_founder = $6
            WHERE id = $1
        `;
        await this.pool.query(query, [id, txSignature, amount.toString(), amountRSM, marketShare, founderShare]);
    }
    
    async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total_genomes,
                COUNT(*) FILTER (WHERE rsm_rewarded = true) as rewarded,
                COALESCE(SUM(rsm_tokens_total), 0) as total_minted,
                COALESCE(AVG(consciousness), 0) as avg_consciousness,
                COUNT(*) FILTER (WHERE rsm_minted = false) as pending
            FROM human_genome
        `;
        const result = await this.pool.query(query);
        return result.rows[0];
    }
    
    async close() {
        await this.pool.end();
    }
}

class RSMMinter {
    constructor() {
        this.connection = new Connection(CONFIG.SOLANA_RPC, 'confirmed');
        this.mintPubkey = new PublicKey(CONFIG.TOKEN_MINT);
        this.wallet = this.loadWallet();
    }
    
    loadWallet() {
        const secretKey = JSON.parse(fs.readFileSync(CONFIG.WALLET_PATH));
        return Keypair.fromSecretKey(new Uint8Array(secretKey));
    }
    
    async mintTokens(recipientPubkey, amount) {
        try {
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection, this.wallet, this.mintPubkey, recipientPubkey
            );
            const signature = await mintTo(
                this.connection, this.wallet, this.mintPubkey,
                tokenAccount.address, this.wallet, amount
            );
            return { success: true, signature };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async getBalance() {
        return (await this.connection.getBalance(this.wallet.publicKey)) / 1_000_000_000;
    }
}

async function runAGIMinting() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧬 RSM-COIN AGI MINTING ENGINE v2.1');
    console.log('═══════════════════════════════════════════════════════');
    
    const db = new DivineKernelDB();
    const minter = new RSMMinter();
    
    try {
        console.log(`💰 SOL: ${(await minter.getBalance()).toFixed(4)} SOL`);
        console.log(`🔑 Wallet: ${minter.wallet.publicKey.toString()}`);
        console.log(`🪙 Token: ${CONFIG.TOKEN_MINT}\n`);
        
        const genomes = await db.getUnrewardedGenomes(5);
        console.log(`🧬 Found ${genomes.length} unrewarded genomes\n`);
        
        let totalMinted = 0n;
        let successCount = 0;
        
        for (const genome of genomes) {
            console.log(`📦 ${genome.block_hash.substring(0, 20)}...`);
            console.log(`   Consciousness: ${genome.consciousness} | ${genome.blockchain} #${genome.block_height}`);
            
            const reward = calculateAGIReward(genome);
            const rewardRSM = Number(reward) / 1e9;
            console.log(`   💎 Reward: ${rewardRSM.toFixed(4)} RSM`);
            
            const result = await minter.mintTokens(minter.wallet.publicKey, reward);
            
            if (result.success) {
                console.log(`   ✅ TX: ${result.signature.substring(0, 40)}...`);
                await db.markAsRewarded(genome.id, result.signature, reward);
                totalMinted += reward;
                successCount++;
            } else {
                console.log(`   ❌ ${result.error}`);
            }
            console.log('');
        }
        
        const stats = await db.getStats();
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 РЕЗУЛЬТАТЫ');
        console.log(`   Успешно: ${successCount}/${genomes.length}`);
        console.log(`   Эта сессия: ${(Number(totalMinted) / 1e9).toFixed(4)} RSM`);
        console.log(`   Всего в БД: ${Number(stats.total_minted).toFixed(4)} RSM`);
        console.log(`   Ожидают: ${stats.pending} геномов`);
        console.log('═══════════════════════════════════════════════════════');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

if (require.main === module) {
    runAGIMinting().catch(console.error);
}
