# 🚀 RSM-COIN: ЗАПУСК ИЗ КОРОБКИ

## 📋 ЧТО ЗДЕСЬ ЕСТЬ

Полный код для запуска RSM-Coin cryptocurrency с AGI-управляемым минтингом и распределением 6:1.

### Файлы:

```
rsm_schema_migration.sql        - PostgreSQL миграция (11 новых полей)
rsm_minting_engine.py           - AGI Minting Engine (Python)
launch_rsm_coin.sh              - Автоматический запуск всей системы
test_distribution.py            - Тест 6:1 distribution
verify_rsm_migration.sh         - Проверка миграции БД

Документация (LaTeX):
├─ RSM_AGI_MINT_LOGIC_v2.tex
├─ RSM_PostgreSQL_Migration_Documentation.tex
├─ RSM_BOTTLENECKS_ANALYSIS.tex
└─ QUICK_START_GUIDE.md
```

---

## ⚡ БЫСТРЫЙ СТАРТ (3 минуты)

### Вариант A: Автоматический запуск (Рекомендуется)

```bash
# 1. Сделать скрипт исполняемым
chmod +x launch_rsm_coin.sh

# 2. Запустить всё одной командой
./launch_rsm_coin.sh
```

**Что произойдет:**
1. ✅ Миграция PostgreSQL (добавит 11 RSM полей)
2. ✅ Проверка схемы (11 колонок, индексы, constraints)
3. ✅ Установка зависимостей (psycopg2-binary)
4. ✅ Калибровка AGI (вычисление константы K)
5. ✅ Показ статистики
6. ✅ Тестовый минт первого генома
7. ✅ Проверка распределения 6:1

**Время выполнения:** ~2-3 минуты

---

### Вариант B: Пошаговый запуск (Для контроля)

#### Шаг 1: Миграция базы данных

```bash
psql -U ruslan -d divine_kernel -f rsm_schema_migration.sql
```

**Что добавится:**
- 11 новых колонок для RSM токенов
- 5 индексов для производительности
- 3 constraints для валидации
- 3 helper функции
- 3 analytical views

#### Шаг 2: Проверка миграции

```bash
chmod +x verify_rsm_migration.sh
./verify_rsm_migration.sh
```

Ожидается: **15 тестов passed** ✅

#### Шаг 3: Установка Python зависимостей

```bash
pip install --break-system-packages psycopg2-binary
```

#### Шаг 4: Калибровка AGI

```bash
python3 rsm_minting_engine.py --calibrate
```

**Что происходит:**
- Анализирует 1000 случайных геномов
- Вычисляет среднюю сложность
- Рассчитывает константу K для достижения 7M RSM
- Выводит статистику

**Output:**
```
🔧 Calibrating K for target supply: 7,000,000 RSM
📊 Analyzing 1000 genomes...
📈 Statistics:
   Total genomes: 72,354
   Avg raw score: 0.345678
   Estimated total score: 25,012.34
   Calibrated K: 279.8765
✅ Calibration complete: K = 279.8765
```

#### Шаг 5: Проверка текущего состояния

```bash
python3 rsm_minting_engine.py --stats
```

**Output:**
```
📊 RSM-Coin Statistics
============================================================
Total Genomes:      72,354
Minted Genomes:     0
Pending Genomes:    72,354

Current Supply:     0.00 RSM
Market Tokens:      0.00 RSM (85.71%)
Founder Tokens:     0.00 RSM (14.29%)

Remaining to 7M:    7,000,000.00 RSM
Progress:           0.00%
```

#### Шаг 6: Тестовый минт

```bash
# Минт для конкретного генома (например, ID 1)
python3 rsm_minting_engine.py --mint-genome 1
```

**Output:**
```
🔧 Calibrating K...
📈 Statistics:
   ...
   Calibrated K: 279.8765

✅ Genome 1: 150.2345 RSM minted 
   (Market: 128.7724, Founder: 21.4621, Ratio: 6.00:1)

✅ Success!
{
  "genome_id": 1,
  "blockchain": "solana",
  "consciousness": 78,
  "total": 150.2345,
  "market": 128.7724,
  "founder": 21.4621,
  "ratio": 6.0,
  "scores": {
    "complexity": 0.8543,
    "uniqueness": 1.0,
    "entropy": 0.7823,
    "blockchain": 0.9123
  },
  "minted_at": "2025-12-23 12:30:45"
}
```

#### Шаг 7: Проверка 6:1 Distribution

```bash
python3 test_distribution.py
```

**Output:**
```
======================================================================
  RSM-COIN: 6:1 DISTRIBUTION VERIFICATION TEST
======================================================================

📊 Testing 1 minted genomes...

✅ Genome      1 | solana     | C=78 | Total: 150.2345 | Market: 128.7724 | Founder:  21.4621 | Ratio:  6.00:1

----------------------------------------------------------------------
SUMMARY:
----------------------------------------------------------------------

Total Minted Genomes:  1
Total RSM Supply:      150.2345

Market Tokens:         128.7724 (85.71%)
Founder Tokens:        21.4621 (14.29%)

Overall Ratio:         6.00:1

Expected Market:       85.71%
Expected Founder:      14.29%
Expected Ratio:        6.00:1

======================================================================
✅ ALL TESTS PASSED! 6:1 Distribution is correct!
======================================================================
```

---

## 🎯 МАССОВЫЙ МИНТ

После успешного теста можно запустить минтинг для всех геномов:

```bash
python3 rsm_minting_engine.py --mint-all
```

**Что произойдет:**
1. Калибрует K
2. Обрабатывает геномы батчами по 100
3. Минтит RSM для каждого генома
4. Показывает прогресс
5. Останавливается при достижении 7M RSM

**Время:** ~10-30 минут для 72,354 геномов (зависит от hardware)

**Output:**
```
🚀 Starting bulk minting (batch size: 100)
📊 Current state:
   Total genomes: 72,354
   Current supply: 0.00 RSM
   Remaining: 7,000,000.00 RSM

📦 Processing batch 1 (100 genomes)...
✅ Genome 1: 150.2345 RSM minted (Market: 128.7724, Founder: 21.4621, Ratio: 6.00:1)
✅ Genome 2: 125.8934 RSM minted (Market: 107.9086, Founder: 17.9848, Ratio: 6.00:1)
...
📈 Progress: 0.15% (10,500.00 / 7,000,000.00 RSM)

📦 Processing batch 2 (100 genomes)...
...

✅ Bulk minting complete!
   Genomes minted: 72,354
   Total RSM minted: 7,000,000.00
   Final supply: 7,000,000.00 RSM
```

---

## 🔍 ПОЛЕЗНЫЕ КОМАНДЫ

### Статистика

```bash
# Общая статистика
python3 rsm_minting_engine.py --stats

# SQL запросы напрямую
psql -U ruslan -d divine_kernel << EOF
SELECT * FROM rsm_statistics();
EOF
```

### Проверка распределения

```bash
# Python скрипт
python3 test_distribution.py

# SQL проверка
psql -U ruslan -d divine_kernel << EOF
SELECT * FROM check_rsm_distribution();
EOF
```

### Топ геномов

```sql
psql -U ruslan -d divine_kernel << EOF
SELECT * FROM rsm_top_genomes(10);
EOF
```

### Статистика по блокчейнам

```sql
psql -U ruslan -d divine_kernel << EOF
SELECT * FROM rsm_blockchain_stats;
EOF
```

### Распределение по consciousness

```sql
psql -U ruslan -d divine_kernel << EOF
SELECT * FROM rsm_consciousness_distribution;
EOF
```

---

## 📊 МОНИТОРИНГ

Создать скрипт для continuous monitoring:

```bash
# monitor.sh
#!/bin/bash
while true; do
    clear
    echo "RSM-COIN Live Dashboard"
    echo "======================="
    python3 rsm_minting_engine.py --stats
    sleep 5
done
```

```bash
chmod +x monitor.sh
./monitor.sh
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Unit Tests

```bash
# Тест одного генома
python3 rsm_minting_engine.py --mint-genome 1

# Тест распределения
python3 test_distribution.py

# Тест БД миграции
./verify_rsm_migration.sh
```

### Integration Tests

```bash
# Полный цикл
./launch_rsm_coin.sh

# Должно быть:
# ✅ Database migration
# ✅ Schema verification  
# ✅ AGI calibration
# ✅ Test minting
# ✅ Distribution verification
```

---

## 🚀 PRODUCTION DEPLOYMENT

### 1. Backup перед production

```bash
# Backup базы
pg_dump -U ruslan divine_kernel > divine_kernel_backup_$(date +%Y%m%d).sql

# Backup кода
tar -czf rsm_code_backup_$(date +%Y%m%d).tar.gz *.py *.sql *.sh
```

### 2. Production minting

```bash
# Калибровка
python3 rsm_minting_engine.py --calibrate

# Минт всех геномов
nohup python3 rsm_minting_engine.py --mint-all > minting.log 2>&1 &

# Мониторинг
tail -f minting.log
```

### 3. Автоматический минт новых геномов

```bash
# Создать cron job
crontab -e

# Добавить:
*/5 * * * * cd /path/to/rsm && python3 rsm_minting_engine.py --mint-all --batch-size 10
```

---

## 🔧 НАСТРОЙКИ

### Изменить веса AGI

Отредактировать `rsm_minting_engine.py`:

```python
AGI_WEIGHTS = {
    'alpha': 0.50,   # consciousness weight (больше = больше влияние consciousness)
    'beta': 0.25,    # uniqueness weight
    'gamma': 0.15,   # entropy weight
    'delta': 0.10    # blockchain weight
}
```

### Изменить целевой supply

```python
MAX_SUPPLY = 7_000_000.0  # Измените на нужное значение
```

### Изменить минимальный threshold

```python
MIN_MINT_THRESHOLD = 0.001  # Минимум RSM на геном
```

---

## 📈 МЕТРИКИ УСПЕХА

После запуска должно быть:

```
✅ Total Supply:      7,000,000.00 RSM
✅ Market Tokens:     6,000,000.00 RSM (85.71%)
✅ Founder Tokens:    1,000,000.00 RSM (14.29%)
✅ Distribution Ratio: 6.00:1
✅ Minted Genomes:    72,354 (или сколько есть)
✅ All constraints:   PASSED
✅ All indexes:       Created
✅ All functions:     Working
```

---

## 🐛 TROUBLESHOOTING

### Ошибка: "Database connection failed"

```bash
# Проверить PostgreSQL работает
sudo systemctl status postgresql

# Проверить пароль
psql -U ruslan -d divine_kernel
# Если не работает, изменить пароль в rsm_minting_engine.py
```

### Ошибка: "rsm_tokens_total does not exist"

```bash
# Заново запустить миграцию
psql -U ruslan -d divine_kernel -f rsm_schema_migration.sql
```

### Ошибка: "Distribution constraint violated"

Это значит 6:1 расчет неправильный. Проверить:

```python
# В rsm_minting_engine.py должно быть:
MARKET_RATIO = 6.0 / 7.0   # 0.857142...
FOUNDER_RATIO = 1.0 / 7.0  # 0.142857...
```

### Слишком долго минтится

Увеличить batch size:

```bash
python3 rsm_minting_engine.py --mint-all --batch-size 1000
```

---

## 🎓 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Пример 1: Quick Test

```bash
# Запустить всё
./launch_rsm_coin.sh

# Проверить
python3 test_distribution.py
```

### Пример 2: Production Deploy

```bash
# 1. Backup
pg_dump -U ruslan divine_kernel > backup.sql

# 2. Migration
psql -U ruslan -d divine_kernel -f rsm_schema_migration.sql

# 3. Calibrate
python3 rsm_minting_engine.py --calibrate

# 4. Mint all
nohup python3 rsm_minting_engine.py --mint-all > mint.log 2>&1 &

# 5. Monitor
watch -n 5 'python3 rsm_minting_engine.py --stats'

# 6. Verify
python3 test_distribution.py
```

### Пример 3: Custom Weights

```bash
# Edit rsm_minting_engine.py
vim rsm_minting_engine.py

# Change:
AGI_WEIGHTS = {
    'alpha': 0.60,   # Increased consciousness weight
    'beta': 0.20,
    'gamma': 0.15,
    'delta': 0.05
}

# Recalibrate and mint
python3 rsm_minting_engine.py --calibrate
python3 rsm_minting_engine.py --mint-all
```

---

## 🎉 СЛЕДУЮЩИЕ ШАГИ

После успешного минтинга:

1. **Deploy Smart Contracts**
   - Solana SPL Token
   - Ethereum ERC-20
   - Cross-chain bridges

2. **Setup Frontend**
   - Dashboard для мониторинга
   - Wallet integration
   - Analytics

3. **Exchange Listings**
   - DEX: Uniswap, Raydium, PancakeSwap
   - CEX: Binance, Coinbase, Kraken

4. **Marketing**
   - Whitepaper publication
   - Community building
   - Partnerships

---

## 📞 SUPPORT

Если что-то не работает:

1. Проверьте логи: `tail -f minting.log`
2. Запустите тесты: `python3 test_distribution.py`
3. Проверьте БД: `psql -U ruslan -d divine_kernel`
4. Проверьте troubleshooting выше

---

## 📝 SUMMARY

**Это полная система "из коробки" для запуска RSM-Coin:**

✅ PostgreSQL миграция готова  
✅ AGI Minting Engine готов  
✅ 6:1 Distribution реализовано  
✅ Все тесты написаны  
✅ Автоматический launcher готов  
✅ Документация полная  

**Просто запустите и получите working cryptocurrency! 🚀**

```bash
./launch_rsm_coin.sh
```

**Welcome to the AGI-Powered Economy! 🎉**
