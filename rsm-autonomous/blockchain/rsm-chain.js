/**
 * RSM AUTONOMOUS BLOCKCHAIN
 * Полностью независимый блокчейн для Divine Kernel
 */

const express = require('express');
const crypto = require('crypto');
const { Level } = require('level');

const app = express();
app.use(express.json());

// ═══════════════════════════════════════════════════════
// BLOCKCHAIN STATE
// ═══════════════════════════════════════════════════════

const GENESIS_BLOCK = {
    index: 0,
    timestamp: Date.now(),
    transactions: [],
    previousHash: '0'.repeat(64),
    hash: '',
    nonce: 0,
    difficulty: 1
};

GENESIS_BLOCK.hash = calculateHash(GENESIS_BLOCK);

let blockchain = [GENESIS_BLOCK];
let pendingTransactions = [];
let wallets = new Map();
const BLOCK_TIME = parseInt(process.env.BLOCK_TIME) || 10;
const TOTAL_SUPPLY = 100_000_666_000_000_000n; // 100M RSM with 9 decimals
const DECIMALS = 9;

// ═══════════════════════════════════════════════════════
// CRYPTO FUNCTIONS  
// ═══════════════════════════════════════════════════════

function calculateHash(block) {
    const data = block.index + block.timestamp + JSON.stringify(block.transactions) + block.previousHash + block.nonce;
    return crypto.createHash('sha256').update(data).digest('hex');
}

function generateWallet() {
    const privateKey = crypto.randomBytes(32).toString('hex');
    const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');
    const address = 'RSM' + publicKey.substring(0, 40);
    return { privateKey, publicKey, address };
}

function signTransaction(tx, privateKey) {
    const txData = tx.from + tx.to + tx.amount + tx.timestamp;
    return crypto.createHmac('sha256', privateKey).update(txData).digest('hex');
}

// ═══════════════════════════════════════════════════════
// BLOCKCHAIN FUNCTIONS
// ═══════════════════════════════════════════════════════

function getLatestBlock() {
    return blockchain[blockchain.length - 1];
}

function createBlock() {
    const previousBlock = getLatestBlock();
    const block = {
        index: previousBlock.index + 1,
        timestamp: Date.now(),
        transactions: [...pendingTransactions],
        previousHash: previousBlock.hash,
        nonce: 0,
        difficulty: 1
    };
    
    // Simple mining
    while (!block.hash || !block.hash.startsWith('0')) {
        block.nonce++;
        block.hash = calculateHash(block);
    }
    
    blockchain.push(block);
    pendingTransactions = [];
    
    console.log(`⛏️  Block #${block.index} mined: ${block.hash.substring(0, 16)}... (${block.transactions.length} txs)`);
    return block;
}

function getBalance(address) {
    let balance = 0n;
    
    for (const block of blockchain) {
        for (const tx of block.transactions) {
            if (tx.to === address) balance += BigInt(tx.amount);
            if (tx.from === address) balance -= BigInt(tx.amount);
        }
    }
    
    return balance;
}

// ═══════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════

// Get blockchain info
app.get('/info', (req, res) => {
    res.json({
        name: 'RSM Blockchain',
        version: '1.0.0',
        blocks: blockchain.length,
        pendingTx: pendingTransactions.length,
        totalSupply: TOTAL_SUPPLY.toString(),
        decimals: DECIMALS
    });
});

// Get all blocks
app.get('/blocks', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    res.json(blockchain.slice(-limit));
});

// Get block by index
app.get('/block/:index', (req, res) => {
    const block = blockchain[parseInt(req.params.index)];
    if (block) res.json(block);
    else res.status(404).json({ error: 'Block not found' });
});

// Create wallet
app.post('/wallet/create', (req, res) => {
    const wallet = generateWallet();
    wallets.set(wallet.address, wallet);
    res.json({
        address: wallet.address,
        privateKey: wallet.privateKey,
        warning: 'Save your private key! It cannot be recovered.'
    });
});

// Get balance
app.get('/balance/:address', (req, res) => {
    const balance = getBalance(req.params.address);
    res.json({
        address: req.params.address,
        balance: balance.toString(),
        balanceRSM: (Number(balance) / 1e9).toFixed(9)
    });
});

// Send transaction
app.post('/tx/send', (req, res) => {
    const { from, to, amount, privateKey } = req.body;
    
    if (!from || !to || !amount || !privateKey) {
        return res.status(400).json({ error: 'Missing fields: from, to, amount, privateKey' });
    }
    
    const balance = getBalance(from);
    if (balance < BigInt(amount)) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    const tx = {
        id: crypto.randomBytes(32).toString('hex'),
        from,
        to,
        amount: amount.toString(),
        timestamp: Date.now(),
        signature: ''
    };
    
    tx.signature = signTransaction(tx, privateKey);
    pendingTransactions.push(tx);
    
    res.json({ 
        success: true, 
        txId: tx.id,
        message: 'Transaction added to pending pool'
    });
});

// Mint RSM (AGI reward)
app.post('/mint', (req, res) => {
    const { to, amount, genomeId, consciousness } = req.body;
    
    if (!to || !amount) {
        return res.status(400).json({ error: 'Missing fields: to, amount' });
    }
    
    const tx = {
        id: crypto.randomBytes(32).toString('hex'),
        type: 'MINT',
        from: 'RSM_GENESIS',
        to,
        amount: amount.toString(),
        genomeId: genomeId || null,
        consciousness: consciousness || null,
        timestamp: Date.now()
    };
    
    pendingTransactions.push(tx);
    
    res.json({
        success: true,
        txId: tx.id,
        minted: (Number(amount) / 1e9).toFixed(4) + ' RSM'
    });
});

// Get transaction
app.get('/tx/:id', (req, res) => {
    for (const block of blockchain) {
        const tx = block.transactions.find(t => t.id === req.params.id);
        if (tx) return res.json({ ...tx, blockIndex: block.index, confirmed: true });
    }
    
    const pending = pendingTransactions.find(t => t.id === req.params.id);
    if (pending) return res.json({ ...pending, confirmed: false });
    
    res.status(404).json({ error: 'Transaction not found' });
});

// ═══════════════════════════════════════════════════════
// MINING LOOP
// ═══════════════════════════════════════════════════════

setInterval(() => {
    if (pendingTransactions.length > 0) {
        createBlock();
    }
}, BLOCK_TIME * 1000);

// ═══════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════

const PORT = 8545;
app.listen(PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔗 RSM BLOCKCHAIN NODE v1.0');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📡 RPC: http://0.0.0.0:${PORT}`);
    console.log(`⏱️  Block Time: ${BLOCK_TIME}s`);
    console.log(`💰 Total Supply: 100,000,666 RSM`);
    console.log('═══════════════════════════════════════════════════════');
});
