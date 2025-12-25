/**
 * RSM AGI MINTER - Docker Version
 */
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'rsm-db',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rsm_blockchain',
    user: process.env.DB_USER || 'rsm_user',
    password: process.env.DB_PASS || 'rsm2480'
});

const BLOCKCHAIN_RPC = process.env.BLOCKCHAIN_RPC || 'http://rsm-blockchain:8545';

async function mintRSM(address, amount, genomeId, consciousness) {
    const response = await fetch(`${BLOCKCHAIN_RPC}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: address, amount, genomeId, consciousness })
    });
    return response.json();
}

async function runMinter() {
    console.log('🧬 RSM AGI Minter Started');
    
    setInterval(async () => {
        try {
            const info = await fetch(`${BLOCKCHAIN_RPC}/info`).then(r => r.json());
            console.log(`📊 Blocks: ${info.blocks}, Pending: ${info.pendingTx}`);
        } catch (e) {
            console.log('⏳ Waiting for blockchain...');
        }
    }, 30000);
}

runMinter();
