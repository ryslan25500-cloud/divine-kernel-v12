const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const BLOCKCHAIN_RPC = process.env.BLOCKCHAIN_RPC || 'http://rsm-blockchain:8545';

app.get('/', (req, res) => {
    res.json({ name: 'RSM API', version: '1.0.0' });
});

app.get('/info', async (req, res) => {
    const info = await fetch(`${BLOCKCHAIN_RPC}/info`).then(r => r.json());
    res.json(info);
});

app.post('/wallet/create', async (req, res) => {
    const wallet = await fetch(`${BLOCKCHAIN_RPC}/wallet/create`, { method: 'POST' }).then(r => r.json());
    res.json(wallet);
});

app.get('/balance/:address', async (req, res) => {
    const balance = await fetch(`${BLOCKCHAIN_RPC}/balance/${req.params.address}`).then(r => r.json());
    res.json(balance);
});

app.listen(3030, () => console.log('🚀 RSM API on port 3030'));
