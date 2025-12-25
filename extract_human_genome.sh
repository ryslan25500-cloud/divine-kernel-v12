#!/bin/bash
# Извлекаем только human_genome и blockchain_counters

INPUT="/tmp/restore.sql"
OUTPUT="/tmp/human_genome_only.sql"

echo "-- Extracting human_genome and blockchain_counters" > $OUTPUT
echo "" >> $OUTPUT

# Извлекаем создание таблицы human_genome
sed -n '/CREATE TABLE public.human_genome/,/^$/p' $INPUT >> $OUTPUT

# Извлекаем sequence для human_genome
sed -n '/CREATE SEQUENCE public.human_genome_id_seq/,/OWNED BY public.human_genome.id;/p' $INPUT >> $OUTPUT

# Извлекаем ALTER для sequence
sed -n '/ALTER TABLE public.human_genome ALTER COLUMN id/p' $INPUT >> $OUTPUT

# Извлекаем PRIMARY KEY
sed -n '/ALTER TABLE ONLY public.human_genome/,/ADD CONSTRAINT human_genome_pkey/p' $INPUT >> $OUTPUT

# Извлекаем данные human_genome
sed -n '/COPY public.human_genome/,/^\\.$/p' $INPUT >> $OUTPUT

# Извлекаем blockchain_counters
sed -n '/CREATE TABLE public.blockchain_counters/,/^$/p' $INPUT >> $OUTPUT
sed -n '/COPY public.blockchain_counters/,/^\\.$/p' $INPUT >> $OUTPUT

echo "" >> $OUTPUT
echo "-- Reset sequence" >> $OUTPUT
echo "SELECT setval('public.human_genome_id_seq', (SELECT MAX(id) FROM public.human_genome));" >> $OUTPUT

echo "✅ Extracted to $OUTPUT"
