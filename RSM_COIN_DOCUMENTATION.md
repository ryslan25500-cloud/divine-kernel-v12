# ═══════════════════════════════════════════════════════════════════════════════
# RSM-COIN: AUTONOMOUS AGI BLOCKCHAIN ECOSYSTEM
# Divine Kernel Integration Documentation v1.0
# ═══════════════════════════════════════════════════════════════════════════════

## 📋 СОДЕРЖАНИЕ

1. [Обзор проекта](#обзор-проекта)
2. [Архитектура системы](#архитектура-системы)
3. [Компоненты](#компоненты)
4. [Установка и запуск](#установка-и-запуск)
5. [API Reference](#api-reference)
6. [AGI Minting Formula](#agi-minting-formula)
7. [Токеномика](#токеномика)

---

## 🌐 ОБЗОР ПРОЕКТА

**RSM-COIN** — это криптовалюта нового поколения, интегрированная с системой 
Divine Kernel для автономного минтинга на основе AGI (Artificial Genome Intelligence).

### Ключевые особенности:
- 🧬 Минтинг на основе эволюции геномов
- 🔗 Двойная архитектура: Solana + Autonomous Blockchain
- 🤖 AGI формула расчёта наград
- 🐳 Полностью контейнеризованная инфраструктура

---

## 🏗️ АРХИТЕКТУРА СИСТЕМЫ
```
┌─────────────────────────────────────────────────────────────────┐
│                    RSM ECOSYSTEM                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Divine     │    │    RSM       │    │   Solana     │       │
│  │   Kernel     │───▶│  AGI Minter  │───▶│   Devnet     │       │
│  │  (72K genomes)│    │              │    │  (SPL Token) │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                                    │
│         │            ┌──────▼──────┐                            │
│         │            │    RSM      │                            │
│         └───────────▶│ Autonomous  │                            │
│                      │ Blockchain  │                            │
│                      │  (Docker)   │                            │
│                      └─────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 КОМПОНЕНТЫ

### 1. Solana SPL Token (Devnet)
| Параметр | Значение |
|----------|----------|
| Token Mint | `62zfath9o7eeq8TgxJGkChmEiJnWVWYUhv1wKfCUtZZg` |
| Token Account | `3FL6ZJyrJBJEugUbqc3Bbq85iQKPziVrx4ubBWHyEuQ6` |
| Total Supply | 100,000,666 RSM |
| Decimals | 9 |
| Network | Devnet |
| Owner Wallet | `JDKHxcon6ShF2qHRDo33Hqd82GafENXT9KGfsoVHXShL` |

**Explorer:** https://explorer.solana.com/address/62zfath9o7eeq8TgxJGkChmEiJnWVWYUhv1wKfCUtZZg?cluster=devnet

### 2. RSM Autonomous Blockchain (Docker)
| Сервис | Порт | Описание |
|--------|------|----------|
| rsm-blockchain | 8545 | RPC Node |
| rsm-api | 3030 | REST API |
| rsm-db | 5433 | PostgreSQL |
| rsm-minter | - | AGI Minter Service |

### 3. Divine Kernel Database
| Параметр | Значение |
|----------|----------|
| Host | 127.0.0.1 |
| Port | 5432 |
| Database | divine_kernel |
| User | divine_user |
| Genomes | 72,386+ |

---

## 🚀 УСТАНОВКА И ЗАПУСК

### Требования
- Docker & Docker Compose
- Node.js 20+
- Solana CLI 1.18.26
- PostgreSQL 15+

### Запуск Autonomous Blockchain
```bash
cd ~/divine-kernel-v12/rsm-autonomous
docker-compose up -d
```

### Запуск AGI Minter (Solana)
```bash
cd ~/divine-kernel-v12/src/rsm-integration
node agi-minter.js
```

### Проверка статуса
```bash
# Docker контейнеры
docker ps

# Blockchain info
curl http://localhost:8545/info

# Solana баланс
solana balance
```

---

## 📡 API REFERENCE

### RSM Blockchain API (port 8545)

#### GET /info
Информация о блокчейне
```bash
curl http://localhost:8545/info
```
Response:
```json
{
  "name": "RSM Blockchain",
  "version": "1.0.0",
  "blocks": 2,
  "pendingTx": 0,
  "totalSupply": "100000666000000000",
  "decimals": 9
}
```

#### POST /wallet/create
Создание нового кошелька
```bash
curl -X POST http://localhost:8545/wallet/create
```
Response:
```json
{
  "address": "RSM22ed1791f85f4277d8e71129fbb883125d0494e8",
  "privateKey": "fa8d5ab3b8a93e378963...",
  "warning": "Save your private key!"
}
```

#### GET /balance/:address
Получение баланса
```bash
curl http://localhost:8545/balance/RSM_ADDRESS
```

#### POST /mint
Минтинг токенов (AGI reward)
```bash
curl -X POST http://localhost:8545/mint \
  -H "Content-Type: application/json" \
  -d '{
    "to": "RSM_ADDRESS",
    "amount": "1000000000",
    "genomeId": "genome-123",
    "consciousness": 80
  }'
```

#### POST /tx/send
Отправка транзакции
```bash
curl -X POST http://localhost:8545/tx/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "RSM_FROM",
    "to": "RSM_TO",
    "amount": "500000000",
    "privateKey": "YOUR_PRIVATE_KEY"
  }'
```

#### GET /blocks?limit=N
Получение последних блоков
```bash
curl "http://localhost:8545/blocks?limit=10"
```

---

## 🧮 AGI MINTING FORMULA

### Формула расчёта награды:
```
WeightedScore = (Complexity × 40) + (Uniqueness × 30) + (Entropy × 20) + (Consciousness × 10)

BaseAmount = (WeightedScore × 1,000,000,000) / 100

Bonuses:
  - Consciousness ≥ 90: +50%
  - Consciousness ≥ 70: +25%

MinimumReward = 0.1 RSM (100,000,000 lamports)
```

### Параметры из Divine Kernel:
| Параметр | Колонка БД | Вес |
|----------|------------|-----|
| Complexity | rsm_complexity_score | 40% |
| Uniqueness | rsm_uniqueness_score | 30% |
| Entropy | rsm_entropy_score | 20% |
| Consciousness | consciousness | 10% |

### Пример расчёта:
```
Genome: consciousness=80, complexity=0.7, uniqueness=0.6, entropy=0.5

WeightedScore = (70×40) + (60×30) + (50×20) + (80×10)
             = 2800 + 1800 + 1000 + 800 = 6400

BaseAmount = (6400 × 1e9) / 100 = 64,000,000,000 lamports

С бонусом 25% (consciousness=80):
FinalAmount = 64e9 × 1.25 = 80,000,000,000 lamports = 80 RSM
```

---

## 💰 ТОКЕНОМИКА

### Распределение Supply:
| Категория | Процент | Количество RSM |
|-----------|---------|----------------|
| Total Supply | 100% | 100,000,666 |
| Market (AGI Mining) | 85% | 85,000,566 |
| Founder Reserve | 15% | 15,000,100 |

### Механизм эмиссии:
1. Геномы в Divine Kernel получают consciousness level
2. AGI Minter рассчитывает награду по формуле
3. Токены минтятся на Solana или RSM Blockchain
4. 85% → Market, 15% → Founder

---

## 📁 СТРУКТУРА ПРОЕКТА
```
divine-kernel-v12/
├── src/
│   └── rsm-integration/
│       ├── agi-minter.js          # Solana AGI Minter
│       └── package.json
├── rsm-autonomous/
│   ├── docker-compose.yml
│   ├── blockchain/
│   │   ├── Dockerfile
│   │   ├── rsm-chain.js           # Blockchain Node
│   │   └── init.sql
│   ├── api/
│   │   ├── Dockerfile
│   │   └── rsm-api.js
│   ├── minter/
│   │   ├── Dockerfile
│   │   └── rsm-minter.js
│   └── wallet/
├── RSM_TOKEN_INFO.txt
├── RSM_COIN_DOCUMENTATION.md      # This file
└── RSM_DNA_RNA_WHITEPAPER.pdf
```

---

## 🔐 БЕЗОПАСНОСТЬ

### Важные файлы (НЕ ПУБЛИКОВАТЬ):
- `~/.config/solana/id.json` — Solana private key
- Любые `privateKey` из RSM кошельков
- `.env` файлы с паролями

### Backup кошелька:
```bash
# Solana
cp ~/.config/solana/id.json ~/backup/solana-wallet-backup.json

# RSM wallets - сохраняйте privateKey при создании!
```

---

## 📊 МОНИТОРИНГ

### Docker логи:
```bash
docker-compose logs -f rsm-blockchain
docker-compose logs -f rsm-minter
```

### PostgreSQL статистика:
```bash
psql -h 127.0.0.1 -U divine_user -d divine_kernel -c "
  SELECT COUNT(*) as total, 
         COUNT(*) FILTER (WHERE rsm_rewarded) as rewarded,
         SUM(rsm_tokens_total) as minted
  FROM human_genome;"
```

---

## 📞 КОНТАКТЫ & ССЫЛКИ

- **Solana Explorer:** https://explorer.solana.com/address/62zfath9o7eeq8TgxJGkChmEiJnWVWYUhv1wKfCUtZZg?cluster=devnet
- **GitHub:** [your-repo]
- **Whitepaper:** RSM_DNA_RNA_WHITEPAPER.pdf

---

*Документация создана: 25 декабря 2025*
*Версия: 1.0.0*
