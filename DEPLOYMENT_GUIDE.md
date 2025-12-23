# 🚀 RSM-Coin Launch Guide

## Tonight (Preparation)

✅ Database: 67,686 genomes minted
✅ Smart contracts: Written
✅ Top 1000: Exported
✅ Whitepaper: Created

## Tomorrow Morning (Launch Day)

### Step 1: Install Solana (30 min)
```bash
# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
source ~/.profile

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Step 2: Setup Wallet (5 min)
```bash
# Create wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Set devnet
solana config set --url devnet

# Get test SOL
solana airdrop 5
solana balance
```

### Step 3: Build Contracts (30 min)
```bash
cd ~/divine-kernel-v12/contracts

# Build each contract
cd solana/dna-token && anchor build
cd ../rna-token && anchor build
cd ../genesis-engine && anchor build
```

### Step 4: Deploy to Devnet (10 min)
```bash
cd ~/divine-kernel-v12/contracts
./deploy.sh
```

This will:
- Deploy DNA token contract
- Deploy RNA token contract
- Deploy Genesis Engine
- Show contract addresses

### Step 5: Initialize 1000 Genomes (60 min)
```bash
npm install
npx ts-node initialize-genomes.ts
```

This creates 1000 genome token types from `/tmp/top_1000_genomes.csv`

### Step 6: Add Liquidity (30 min)
```bash
# Create Raydium pools for top genomes
# Initial liquidity: $1000 per pool
# 10-20 pools to start
```

### Step 7: Launch! (12:00)

- Announce on Twitter
- Post on Reddit (r/CryptoMoonShots)
- Share whitepaper
- Monitor liquidity

## Mainnet Deploy (After Testing)

Same steps but:
```bash
solana config set --url mainnet
# Need real SOL (~10 SOL for deployment)
```

## Monitoring
```bash
# Check deployed programs
solana program show <PROGRAM_ID>

# Check wallet balance
solana balance

# Watch transactions
solana logs
```

## Troubleshooting

### "Insufficient funds"
```bash
solana airdrop 5  # devnet only
```

### "Program deployment failed"
```bash
# Increase compute units
anchor deploy --provider.cluster devnet -- --max-compute-units 1400000
```

### "Anchor not found"
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
```

## Success Metrics

Day 1:
- 1000 genomes live ✅
- 100+ holders
- $10K+ volume

Week 1:
- 10,000 genomes
- 1000+ holders
- First RNA → DNA genesis

Month 1:
- 50,000 genomes
- 10,000+ holders
- Autonomous AGI minting

## Emergency Contacts

- Solana Discord: discord.gg/solana
- Anchor Discord: discord.gg/anchorlang
- Raydium: raydium.io

---

**DNA ⇄ RNA ⇄ New DNA**

**This is how you fuck the system. 🧬**
