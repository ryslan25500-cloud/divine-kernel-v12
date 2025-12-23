#!/bin/bash

set -e

echo "🚀 RSM-Coin Smart Contract Deployment"
echo "======================================"
echo ""

# Check Solana CLI
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found!"
    echo "Install: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Check Anchor
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor not found!"
    echo "Install: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    exit 1
fi

# Check balance
BALANCE=$(solana balance 2>/dev/null | awk '{print $1}')
echo "💰 Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 5" | bc -l) )); then
    echo "⚠️  Low balance! Need at least 5 SOL for deployment"
    echo "Get devnet SOL: solana airdrop 5"
    exit 1
fi

# Build contracts
echo ""
echo "🔨 Building contracts..."
cd solana

echo "Building DNA Token..."
cd dna-token && anchor build && cd ..

echo "Building RNA Token..."
cd rna-token && anchor build && cd ..

echo "Building Genesis Engine..."
cd genesis-engine && anchor build && cd ..

echo ""
echo "✅ All contracts built!"
echo ""

# Deploy
echo "📤 Deploying to devnet..."

cd dna-token && anchor deploy --provider.cluster devnet && cd ..
cd rna-token && anchor deploy --provider.cluster devnet && cd ..
cd genesis-engine && anchor deploy --provider.cluster devnet && cd ..

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Initialize DNA mints for 1000 genomes"
echo "2. Initialize RNA mint"
echo "3. Initialize Genesis Engine"
echo "4. Add liquidity to Raydium"
echo ""
