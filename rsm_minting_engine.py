#!/usr/bin/env python3
"""
RSM-COIN AGI MINTING ENGINE v1.0
Autonomous token minting with 6:1 distribution
"""

import os
import sys
import math
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import json

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

DB_CONFIG = {
    'host': 'localhost',
    'database': 'divine_kernel',
    'user': 'divine_user',
    'password': '2480'
}

# AGI Weights (initial values)
AGI_WEIGHTS = {
    'alpha': 0.50,   # consciousness weight
    'beta': 0.25,    # uniqueness weight
    'gamma': 0.15,   # entropy weight
    'delta': 0.10    # blockchain weight
}

# RSM Constants
MAX_SUPPLY = 100_000_666.0
MIN_MINT_THRESHOLD = 0.001
MARKET_RATIO = 6.0 / 7.0  # 85.71%
FOUNDER_RATIO = 1.0 / 7.0  # 14.29%

# Blockchain weights
BLOCKCHAIN_WEIGHTS = {
    'bitcoin': 1.0,
    'ethereum': 0.9,
    'solana': 0.85,
    'polygon': 0.7,
    'arbitrum': 0.7,
    'avalanche': 0.7,
    'optimism': 0.7,
    'base': 0.7,
    'zkevm': 0.7,
    'bsc': 0.6
}

# ═══════════════════════════════════════════════════════════════════════════
# AGI MINTING ENGINE
# ═══════════════════════════════════════════════════════════════════════════

class AGIMintingEngine:
    """
    Autonomous General Intelligence for RSM Token Minting
    Calculates token amounts based on genome complexity
    """
    
    def __init__(self, db_config: Dict[str, str]):
        self.db_config = db_config
        self.conn = None
        self.cursor = None
        
        # AGI parameters
        self.alpha = AGI_WEIGHTS['alpha']
        self.beta = AGI_WEIGHTS['beta']
        self.gamma = AGI_WEIGHTS['gamma']
        self.delta = AGI_WEIGHTS['delta']
        
        # Calibration constant (will be computed)
        self.K = 1.0
        
        # Statistics
        self.total_minted = 0.0
        self.total_genomes_minted = 0
        
    def connect(self):
        """Connect to PostgreSQL"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            print("✅ Connected to PostgreSQL")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from PostgreSQL"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✅ Disconnected from PostgreSQL")
    
    def get_genome_count(self) -> int:
        """Get total genome count"""
        self.cursor.execute("SELECT COUNT(*) as count FROM human_genome")
        result = self.cursor.fetchone()
        return result['count']
    
    def get_current_supply(self) -> float:
        """Get current RSM supply"""
        self.cursor.execute("""
            SELECT COALESCE(SUM(rsm_tokens_total), 0) as supply
            FROM human_genome
            WHERE rsm_minted = TRUE
        """)
        result = self.cursor.fetchone()
        return float(result['supply'])
    
    def calculate_consciousness_complexity(self, genome: Dict) -> float:
        """
        Calculate C(G) - Consciousness-based complexity
        
        C(G) = w_c * (consciousness/81) + 
               w_l * log2(1 + L) / log2(101) +
               w_gc * GC_content
        """
        consciousness = genome.get('consciousness', 0)
        dna_tetrad = genome.get('dna_tetrad', '')
        
        # Consciousness component (normalized to [0,1])
        c_norm = consciousness / 81.0 if consciousness else 0.0
        
        # Length component (logarithmic)
        dna_length = len(dna_tetrad)
        if dna_length > 0:
            l_component = math.log2(1 + dna_length) / math.log2(101)
        else:
            l_component = 0.0
        
        # GC content
        if dna_length > 0:
            gc_count = dna_tetrad.count('G') + dna_tetrad.count('C')
            gc_content = gc_count / dna_length
        else:
            gc_content = 0.5  # neutral
        
        # Weighted sum
        complexity = (
            0.6 * c_norm +
            0.3 * l_component +
            0.1 * gc_content
        )
        
        return max(0.0, min(1.0, complexity))
    
    def calculate_uniqueness(self, genome: Dict) -> float:
        """
        Calculate U(G) - Uniqueness score
        
        For now: simple hash-based uniqueness
        Later: implement LSH for proper similarity
        """
        dna_tetrad = genome.get('dna_tetrad', '')
        
        if not dna_tetrad:
            return 0.0
        
        # Hash DNA sequence
        dna_hash = hashlib.sha256(dna_tetrad.encode()).hexdigest()
        
        # Check if we've seen this exact sequence before
        self.cursor.execute("""
            SELECT COUNT(*) as count
            FROM human_genome
            WHERE dna_tetrad = %s
            AND id < %s
        """, (dna_tetrad, genome['id']))
        
        result = self.cursor.fetchone()
        duplicates = result['count']
        
        if duplicates == 0:
            return 1.0  # Completely unique
        else:
            # Penalize duplicates
            return 1.0 / (1 + duplicates)
    
    def calculate_entropy(self, genome: Dict) -> float:
        """
        Calculate H(G) - Shannon entropy
        
        H(G) = -Σ p_i * log2(p_i) for nucleotides {A,T,G,C}
        Normalized to [0,1] where max entropy = 2 bits
        """
        dna_tetrad = genome.get('dna_tetrad', '')
        
        if not dna_tetrad:
            return 0.0
        
        # Count nucleotides
        counts = {
            'A': dna_tetrad.count('A'),
            'T': dna_tetrad.count('T'),
            'G': dna_tetrad.count('G'),
            'C': dna_tetrad.count('C')
        }
        
        total = sum(counts.values())
        if total == 0:
            return 0.0
        
        # Shannon entropy
        entropy = 0.0
        for count in counts.values():
            if count > 0:
                p = count / total
                entropy -= p * math.log2(p)
        
        # Normalize to [0,1] (max entropy = 2 bits)
        return entropy / 2.0
    
    def calculate_blockchain_metric(self, genome: Dict) -> float:
        """
        Calculate B(G) - Blockchain reliability metric
        
        B(G) = w_b * blockchain_weight + 
               w_h * log2(block_height) / 32
        """
        blockchain = genome.get('blockchain', 'unknown')
        block_height = genome.get('block_height', 0)
        
        # Blockchain weight
        w_blockchain = BLOCKCHAIN_WEIGHTS.get(
            blockchain.lower(), 
            0.5  # default for unknown
        )
        
        # Height component (logarithmic)
        if block_height and block_height > 0:
            w_height = min(math.log2(block_height) / 32.0, 1.0)
        else:
            w_height = 0.0
        
        # Weighted sum
        b_metric = 0.7 * w_blockchain + 0.3 * w_height
        
        return max(0.0, min(1.0, b_metric))
    
    def calculate_token_amount(self, genome: Dict) -> Tuple[float, Dict[str, float]]:
        """
        Calculate total RSM tokens for a genome
        
        T(G) = K * [α*C(G) + β*U(G) + γ*H(G) + δ*B(G)]
        
        Returns: (total_tokens, scores_dict)
        """
        # Calculate all components
        C = self.calculate_consciousness_complexity(genome)
        U = self.calculate_uniqueness(genome)
        H = self.calculate_entropy(genome)
        B = self.calculate_blockchain_metric(genome)
        
        # Store scores
        scores = {
            'complexity': C,
            'uniqueness': U,
            'entropy': H,
            'blockchain': B
        }
        
        # Total tokens (before distribution)
        raw_score = (
            self.alpha * C +
            self.beta * U +
            self.gamma * H +
            self.delta * B
        )
        
        total_tokens = self.K * raw_score
        
        return total_tokens, scores
    
    def mint_tokens(self, genome: Dict) -> Optional[Dict]:
        """
        Mint RSM tokens for a genome with 6:1 distribution
        
        Returns: {
            'genome_id': int,
            'total': float,
            'market': float,
            'founder': float,
            'scores': dict,
            'minted_at': datetime
        }
        """
        genome_id = genome['id']
        
        # Check if already minted
        if genome.get('rsm_minted'):
            print(f"⚠️  Genome {genome_id} already minted")
            return None
        
        # Calculate token amount
        total_tokens, scores = self.calculate_token_amount(genome)
        
        # Check minimum threshold
        if total_tokens < MIN_MINT_THRESHOLD:
            print(f"⚠️  Genome {genome_id}: tokens {total_tokens:.6f} below threshold")
            return None
        
        # Check max supply
        current_supply = self.get_current_supply()
        if current_supply + total_tokens > MAX_SUPPLY:
            total_tokens = MAX_SUPPLY - current_supply
            print(f"⚠️  Adjusted tokens to respect max supply: {total_tokens:.6f}")
        
        # 6:1 DISTRIBUTION
        market_tokens = total_tokens * MARKET_RATIO
        founder_tokens = total_tokens * FOUNDER_RATIO
        
        # Verify distribution (should equal total within floating point error)
        distribution_sum = market_tokens + founder_tokens
        assert abs(distribution_sum - total_tokens) < 1e-8, \
            f"Distribution error: {market_tokens} + {founder_tokens} != {total_tokens}"
        
        # Update database
        try:
            self.cursor.execute("""
                UPDATE human_genome
                SET 
                    rsm_tokens_total = %s,
                    rsm_tokens_market = %s,
                    rsm_tokens_founder = %s,
                    rsm_complexity_score = %s,
                    rsm_uniqueness_score = %s,
                    rsm_entropy_score = %s,
                    rsm_blockchain_score = %s,
                    rsm_minted = TRUE,
                    rsm_minted_at = %s,
                    rsm_calibration_k = %s
                WHERE id = %s
            """, (
                total_tokens,
                market_tokens,
                founder_tokens,
                scores['complexity'],
                scores['uniqueness'],
                scores['entropy'],
                scores['blockchain'],
                datetime.now(),
                self.K,
                genome_id
            ))
            
            self.conn.commit()
            
            # Update statistics
            self.total_minted += total_tokens
            self.total_genomes_minted += 1
            
            result = {
                'genome_id': genome_id,
                'blockchain': genome['blockchain'],
                'consciousness': genome.get('consciousness', 0),
                'total': total_tokens,
                'market': market_tokens,
                'founder': founder_tokens,
                'ratio': market_tokens / founder_tokens if founder_tokens > 0 else 0,
                'scores': scores,
                'minted_at': datetime.now()
            }
            
            print(f"✅ Genome {genome_id}: {total_tokens:.6f} RSM minted "
                  f"(Market: {market_tokens:.6f}, Founder: {founder_tokens:.6f}, "
                  f"Ratio: {result['ratio']:.2f}:1)")
            
            return result
            
        except Exception as e:
            self.conn.rollback()
            print(f"❌ Mint failed for genome {genome_id}: {e}")
            return None
    
    def calibrate_K(self, target_supply: float = MAX_SUPPLY, 
                    sample_size: int = 1000) -> float:
        """
        Calibrate K to reach target supply
        
        K = target_supply / Σ[α*C(G) + β*U(G) + γ*H(G) + δ*B(G)]
        """
        print(f"\n🔧 Calibrating K for target supply: {target_supply:,.0f} RSM")
        
        # Get sample of genomes
        self.cursor.execute(f"""
            SELECT *
            FROM human_genome
            WHERE rsm_minted = FALSE
            ORDER BY RANDOM()
            LIMIT {sample_size}
        """)
        
        genomes = self.cursor.fetchall()
        
        if not genomes:
            print("❌ No genomes available for calibration")
            return 1.0
        
        print(f"📊 Analyzing {len(genomes)} genomes...")
        
        # Calculate sum of raw scores
        total_raw_score = 0.0
        
        for genome in genomes:
            C = self.calculate_consciousness_complexity(genome)
            U = self.calculate_uniqueness(genome)
            H = self.calculate_entropy(genome)
            B = self.calculate_blockchain_metric(genome)
            
            raw_score = (
                self.alpha * C +
                self.beta * U +
                self.gamma * H +
                self.delta * B
            )
            
            total_raw_score += raw_score
        
        # Calculate average and extrapolate
        avg_raw_score = total_raw_score / len(genomes)
        total_genomes = self.get_genome_count()
        estimated_total_score = avg_raw_score * total_genomes
        
        # Calculate K
        if estimated_total_score > 0:
            K = target_supply / estimated_total_score
        else:
            K = 1.0
        
        print(f"📈 Statistics:")
        print(f"   Total genomes: {total_genomes:,}")
        print(f"   Avg raw score: {avg_raw_score:.6f}")
        print(f"   Estimated total score: {estimated_total_score:.2f}")
        print(f"   Calibrated K: {K:.4f}")
        
        self.K = K
        return K
    
    def mint_all_genomes(self, batch_size: int = 100):
        """
        Mint RSM for all unminted genomes
        """
        print(f"\n🚀 Starting bulk minting (batch size: {batch_size})")
        
        total_genomes = self.get_genome_count()
        current_supply = self.get_current_supply()
        
        print(f"📊 Current state:")
        print(f"   Total genomes: {total_genomes:,}")
        print(f"   Current supply: {current_supply:,.2f} RSM")
        print(f"   Remaining: {MAX_SUPPLY - current_supply:,.2f} RSM")
        
        # Get unminted genomes in batches
        offset = 0
        total_minted_count = 0
        total_minted_tokens = 0.0
        
        while True:
            self.cursor.execute(f"""
                SELECT *
                FROM human_genome
                WHERE rsm_minted = FALSE
                ORDER BY id
                LIMIT {batch_size}
                OFFSET {offset}
            """)
            
            genomes = self.cursor.fetchall()
            
            if not genomes:
                break
            
            print(f"\n📦 Processing batch {offset//batch_size + 1} "
                  f"({len(genomes)} genomes)...")
            
            for genome in genomes:
                result = self.mint_tokens(genome)
                if result:
                    total_minted_count += 1
                    total_minted_tokens += result['total']
            
            offset += batch_size
            
            # Progress update
            current_supply = self.get_current_supply()
            progress = (current_supply / MAX_SUPPLY) * 100
            print(f"📈 Progress: {progress:.2f}% ({current_supply:,.2f} / {MAX_SUPPLY:,.0f} RSM)")
            
            # Stop if we hit max supply
            if current_supply >= MAX_SUPPLY:
                print(f"🎯 Max supply reached!")
                break
        
        print(f"\n✅ Bulk minting complete!")
        print(f"   Genomes minted: {total_minted_count:,}")
        print(f"   Total RSM minted: {total_minted_tokens:,.2f}")
        print(f"   Final supply: {self.get_current_supply():,.2f} RSM")

# ═══════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ═══════════════════════════════════════════════════════════════════════════

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='RSM-Coin AGI Minting Engine'
    )
    parser.add_argument(
        '--calibrate',
        action='store_true',
        help='Calibrate K constant'
    )
    parser.add_argument(
        '--mint-all',
        action='store_true',
        help='Mint RSM for all genomes'
    )
    parser.add_argument(
        '--mint-genome',
        type=int,
        metavar='ID',
        help='Mint RSM for specific genome ID'
    )
    parser.add_argument(
        '--stats',
        action='store_true',
        help='Show current statistics'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Batch size for bulk minting (default: 100)'
    )
    
    args = parser.parse_args()
    
    # Create engine
    engine = AGIMintingEngine(DB_CONFIG)
    
    if not engine.connect():
        sys.exit(1)
    
    try:
        if args.stats:
            # Show statistics
            print("\n📊 RSM-Coin Statistics")
            print("=" * 60)
            
            total_genomes = engine.get_genome_count()
            current_supply = engine.get_current_supply()
            
            engine.cursor.execute("""
                SELECT COUNT(*) as count
                FROM human_genome
                WHERE rsm_minted = TRUE
            """)
            minted_count = engine.cursor.fetchone()['count']
            
            engine.cursor.execute("""
                SELECT 
                    COALESCE(SUM(rsm_tokens_market), 0) as market,
                    COALESCE(SUM(rsm_tokens_founder), 0) as founder
                FROM human_genome
                WHERE rsm_minted = TRUE
            """)
            distribution = engine.cursor.fetchone()
            
            print(f"Total Genomes:      {total_genomes:,}")
            print(f"Minted Genomes:     {minted_count:,}")
            print(f"Pending Genomes:    {total_genomes - minted_count:,}")
            print(f"\nCurrent Supply:     {current_supply:,.2f} RSM")
            print(f"Market Tokens:      {float(distribution['market']):,.2f} RSM ({MARKET_RATIO*100:.2f}%)")
            print(f"Founder Tokens:     {float(distribution['founder']):,.2f} RSM ({FOUNDER_RATIO*100:.2f}%)")
            print(f"\nRemaining to 7M:    {MAX_SUPPLY - current_supply:,.2f} RSM")
            print(f"Progress:           {(current_supply/MAX_SUPPLY)*100:.2f}%")
            
        elif args.calibrate:
            # Calibrate K
            K = engine.calibrate_K()
            print(f"\n✅ Calibration complete: K = {K:.4f}")
            
        elif args.mint_genome:
            # Mint specific genome
            engine.cursor.execute(
                "SELECT * FROM human_genome WHERE id = %s",
                (args.mint_genome,)
            )
            genome = engine.cursor.fetchone()
            
            if not genome:
                print(f"❌ Genome {args.mint_genome} not found")
            else:
                # Calibrate first
                print("🔧 Calibrating K...")
                engine.calibrate_K()
                
                # Mint
                result = engine.mint_tokens(genome)
                if result:
                    print(f"\n✅ Success!")
                    print(json.dumps(result, indent=2, default=str))
                    
        elif args.mint_all:
            # Calibrate first
            print("🔧 Calibrating K...")
            engine.calibrate_K()
            
            # Mint all
            engine.mint_all_genomes(batch_size=args.batch_size)
            
        else:
            parser.print_help()
    
    finally:
        engine.disconnect()

if __name__ == '__main__':
    main()
