/**
 * RSM DEX - Decentralized Exchange
 * 1 RSM = $10,000 USD
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════
// LIQUIDITY POOLS - 1 RSM = $10,000
// ═══════════════════════════════════════════════════════

const pools = {
    'RSM-USDT': {
        rsm: 1000_000000000n,           // 1,000 RSM
        usdt: 10000000_000000n,         // 10,000,000 USDT ($10K per RSM)
        lpSupply: 100000_000000000n,
        fee: 0.003
    },
    'RSM-ETH': {
        rsm: 1000_000000000n,           // 1,000 RSM  
        eth: 2500_000000000000000000n,  // 2,500 ETH (~$10K per RSM @ ETH=$4000)
        lpSupply: 100000_000000000n,
        fee: 0.003
    },
    'RSM-BTC': {
        rsm: 1000_000000000n,           // 1,000 RSM
        btc: 100_00000000n,             // 100 BTC (~$10K per RSM @ BTC=$100K)
        lpSupply: 100000_000000000n,
        fee: 0.003
    }
};

const trades = [];

// ═══════════════════════════════════════════════════════
// PRICE CALCULATION
// ═══════════════════════════════════════════════════════

function getPrice(poolId) {
    const pool = pools[poolId];
    if (!pool) return null;
    
    if (poolId === 'RSM-USDT') {
        return Number(pool.usdt) / Number(pool.rsm);
    } else if (poolId === 'RSM-ETH') {
        const ethPerRsm = Number(pool.eth) / Number(pool.rsm);
        return ethPerRsm * 4000; // ETH price ~$4000
    } else if (poolId === 'RSM-BTC') {
        const btcPerRsm = Number(pool.btc) / Number(pool.rsm);
        return btcPerRsm * 100000; // BTC price ~$100K
    }
    return 0;
}

function calculateSwap(poolId, tokenIn, amountIn) {
    const pool = pools[poolId];
    if (!pool) return { error: 'Pool not found' };
    
    const fee = pool.fee;
    const amountInWithFee = BigInt(Math.floor(Number(amountIn) * (1 - fee)));
    
    let amountOut;
    const k = pool.rsm * pool.usdt;
    
    if (tokenIn === 'RSM') {
        const newRsm = pool.rsm + amountInWithFee;
        const newUsdt = k / newRsm;
        amountOut = pool.usdt - newUsdt;
    } else {
        const newUsdt = pool.usdt + amountInWithFee;
        const newRsm = k / newUsdt;
        amountOut = pool.rsm - newRsm;
    }
    
    return {
        amountIn: amountIn.toString(),
        amountOut: amountOut.toString(),
        rate: (Number(amountOut) / Number(amountIn)).toFixed(6),
        fee: (Number(amountIn) * fee).toString()
    };
}

// ═══════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════

app.get('/', (req, res) => {
    res.json({
        name: 'RSM DEX',
        version: '2.0.0',
        basePrice: '$10,000 per RSM',
        pools: Object.keys(pools),
        totalTrades: trades.length,
        marketCap: '$1,000,006,660,000'
    });
});

app.get('/pools', (req, res) => {
    const poolsInfo = {};
    for (const [id, pool] of Object.entries(pools)) {
        poolsInfo[id] = {
            rsm: (Number(pool.rsm) / 1e9).toFixed(2) + ' RSM',
            priceUSD: '$' + getPrice(id).toLocaleString(),
            fee: pool.fee * 100 + '%'
        };
    }
    res.json(poolsInfo);
});

app.get('/price/:poolId', (req, res) => {
    const price = getPrice(req.params.poolId);
    if (price === null) return res.status(404).json({ error: 'Pool not found' });
    
    res.json({
        pool: req.params.poolId,
        priceUSD: price,
        priceFormatted: '$' + price.toLocaleString()
    });
});

app.get('/price', (req, res) => {
    res.json({
        RSM_USD: 10000,
        RSM_ETH: 2.5,
        RSM_BTC: 0.1,
        marketCap: '$1,000,006,660,000',
        circulatingSupply: '100,000,666 RSM',
        totalSupply: '100,000,666 RSM'
    });
});

app.post('/quote', (req, res) => {
    const { poolId, tokenIn, amountIn } = req.body;
    if (!poolId || !tokenIn || !amountIn) {
        return res.status(400).json({ error: 'Missing: poolId, tokenIn, amountIn' });
    }
    const quote = calculateSwap(poolId, tokenIn, BigInt(amountIn));
    res.json(quote);
});

app.post('/swap', (req, res) => {
    const { poolId, tokenIn, amountIn, wallet } = req.body;
    if (!poolId || !tokenIn || !amountIn || !wallet) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    
    const quote = calculateSwap(poolId, tokenIn, BigInt(amountIn));
    if (quote.error) return res.status(400).json(quote);
    
    const trade = {
        id: crypto.randomBytes(32).toString('hex'),
        poolId,
        tokenIn,
        amountIn: amountIn.toString(),
        amountOut: quote.amountOut,
        wallet,
        timestamp: Date.now()
    };
    trades.push(trade);
    
    res.json({ success: true, tradeId: trade.id, ...quote });
});

app.get('/trades', (req, res) => {
    res.json(trades.slice(-20));
});

// ═══════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════

const PORT = 3031;
app.listen(PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🏦 RSM DEX v2.0 - Premium Edition');
    console.log('═══════════════════════════════════════════════════════');
    console.log('💰 1 RSM = $10,000 USD');
    console.log('📊 Market Cap: $1 Trillion');
    console.log('📡 API: http://0.0.0.0:' + PORT);
    console.log('═══════════════════════════════════════════════════════');
});
