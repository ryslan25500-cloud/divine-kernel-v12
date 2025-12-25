# RSM-COIN QUICK REFERENCE CARD
═══════════════════════════════════════════════════════

## 🔗 ENDPOINTS

| Service | URL |
|---------|-----|
| Blockchain RPC | http://localhost:8545 |
| REST API | http://localhost:3030 |
| PostgreSQL RSM | localhost:5433 |
| PostgreSQL Divine | localhost:5432 |

## 🪙 TOKEN INFO

**Solana Devnet:**
- Mint: `62zfath9o7eeq8TgxJGkChmEiJnWVWYUhv1wKfCUtZZg`
- Supply: 100,000,666 RSM

**RSM Blockchain:**
- Supply: 100,000,666 RSM
- Block Time: 10s

## ⚡ QUICK COMMANDS
```bash
# Start blockchain
cd ~/divine-kernel-v12/rsm-autonomous
docker-compose up -d

# Stop blockchain
docker-compose down

# View logs
docker-compose logs -f

# Blockchain info
curl http://localhost:8545/info

# Create wallet
curl -X POST http://localhost:8545/wallet/create

# Check balance
curl http://localhost:8545/balance/RSM_ADDRESS

# Mint tokens
curl -X POST http://localhost:8545/mint \
  -H "Content-Type: application/json" \
  -d '{"to":"ADDRESS","amount":"1000000000"}'

# Run AGI Minter (Solana)
cd ~/divine-kernel-v12/src/rsm-integration
node agi-minter.js

# Solana balance
solana balance

# Divine Kernel stats
psql -h 127.0.0.1 -U divine_user -d divine_kernel \
  -c "SELECT COUNT(*) FROM human_genome WHERE rsm_rewarded=true;"
```

## 📊 СТАТУС ПРОЕКТА (25.12.2025)

| Компонент | Статус |
|-----------|--------|
| Solana Token | ✅ Создан |
| AGI Minter | ✅ Работает |
| Docker Blockchain | ✅ Работает |
| Divine Kernel | ✅ 72K+ геномов |
| Документация | ✅ Готова |

## 🔐 ВАЖНЫЕ ФАЙЛЫ

- Solana wallet: `~/.config/solana/id.json`
- Documentation: `~/divine-kernel-v12/RSM_COIN_DOCUMENTATION.md`
- Docker config: `~/divine-kernel-v12/rsm-autonomous/docker-compose.yml`
- AGI Minter: `~/divine-kernel-v12/src/rsm-integration/agi-minter.js`

═══════════════════════════════════════════════════════
