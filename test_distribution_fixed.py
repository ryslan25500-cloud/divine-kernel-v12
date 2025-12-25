#!/usr/bin/env python3
"""
Quick test: Verify 6:1 distribution is working correctly
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'localhost',
    'database': 'divine_kernel',
    'user': 'divine_user',
    'password': '2480'
}

def test_distribution():
    """Test 6:1 distribution for all minted genomes"""
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    print("\n" + "="*70)
    print("  RSM-COIN: 6:1 DISTRIBUTION VERIFICATION TEST")
    print("="*70 + "\n")
    
    # Get all minted genomes
    cursor.execute("""
        SELECT 
            id,
            blockchain,
            consciousness,
            rsm_tokens_total,
            rsm_tokens_market,
            rsm_tokens_founder,
            CASE 
                WHEN rsm_tokens_founder > 0 
                THEN rsm_tokens_market / rsm_tokens_founder
                ELSE 0
            END as ratio,
            rsm_minted_at
        FROM human_genome
        WHERE rsm_minted = TRUE
        ORDER BY rsm_tokens_total DESC
        LIMIT 20
    """)
    
    results = cursor.fetchall()
    
    if not results:
        print("❌ No minted genomes found!\n")
        return False
    
    print(f"📊 Testing {len(results)} minted genomes...\n")
    
    all_valid = True
    total_market = 0
    total_founder = 0
    
    for i, row in enumerate(results, 1):
        total = float(row['rsm_tokens_total'])
        market = float(row['rsm_tokens_market'])
        founder = float(row['rsm_tokens_founder'])
        ratio = float(row['ratio'])
        
        total_market += market
        total_founder += founder
        
        # Check if distribution is correct
        expected_market = total * (6.0 / 7.0)
        expected_founder = total * (1.0 / 7.0)
        
        market_error = abs(market - expected_market)
        founder_error = abs(founder - expected_founder)
        sum_error = abs((market + founder) - total)
        
        is_valid = (
            market_error < 1e-6 and
            founder_error < 1e-6 and
            sum_error < 1e-6 and
            abs(ratio - 6.0) < 0.01
        )
        
        consciousness = row['consciousness'] if row['consciousness'] is not None else 0
        status = "✅" if is_valid else "❌"
        
        print(f"{status} Genome {row['id']:6d} | "
              f"{row['blockchain']:10s} | "
              f"C={consciousness:2d} | "
              f"Total: {total:8.4f} | "
              f"Market: {market:8.4f} | "
              f"Founder: {founder:8.4f} | "
              f"Ratio: {ratio:5.2f}:1")
        
        if not is_valid:
            all_valid = False
            print(f"   ⚠️  Market error: {market_error:.8f}")
            print(f"   ⚠️  Founder error: {founder_error:.8f}")
            print(f"   ⚠️  Sum error: {sum_error:.8f}")
    
    # Overall statistics
    print("\n" + "-"*70)
    print("SUMMARY:")
    print("-"*70)
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total_minted,
            SUM(rsm_tokens_total) as total_rsm,
            SUM(rsm_tokens_market) as market_rsm,
            SUM(rsm_tokens_founder) as founder_rsm
        FROM human_genome
        WHERE rsm_minted = TRUE
    """)
    
    stats = cursor.fetchone()
    
    total_rsm = float(stats['total_rsm'])
    market_rsm = float(stats['market_rsm'])
    founder_rsm = float(stats['founder_rsm'])
    
    if total_rsm > 0:
        market_percentage = (market_rsm / total_rsm) * 100
        founder_percentage = (founder_rsm / total_rsm) * 100
        overall_ratio = market_rsm / founder_rsm if founder_rsm > 0 else 0
    else:
        market_percentage = 0
        founder_percentage = 0
        overall_ratio = 0
    
    print(f"\nTotal Minted Genomes:  {stats['total_minted']:,}")
    print(f"Total RSM Supply:      {total_rsm:,.4f}")
    print(f"\nMarket Tokens:         {market_rsm:,.4f} ({market_percentage:.2f}%)")
    print(f"Founder Tokens:        {founder_rsm:,.4f} ({founder_percentage:.2f}%)")
    print(f"\nOverall Ratio:         {overall_ratio:.2f}:1")
    
    # Expected values
    expected_market_pct = (6.0/7.0) * 100
    expected_founder_pct = (1.0/7.0) * 100
    
    print(f"\nExpected Market:       {expected_market_pct:.2f}%")
    print(f"Expected Founder:      {expected_founder_pct:.2f}%")
    print(f"Expected Ratio:        6.00:1")
    
    # Validation
    market_pct_error = abs(market_percentage - expected_market_pct)
    founder_pct_error = abs(founder_percentage - expected_founder_pct)
    ratio_error = abs(overall_ratio - 6.0)
    
    distribution_valid = (
        market_pct_error < 0.1 and
        founder_pct_error < 0.1 and
        ratio_error < 0.01
    )
    
    print("\n" + "="*70)
    
    if all_valid and distribution_valid:
        print("✅ ALL TESTS PASSED! 6:1 Distribution is correct!")
    else:
        print("❌ SOME TESTS FAILED! Check errors above.")
    
    print("="*70 + "\n")
    
    cursor.close()
    conn.close()
    
    return all_valid and distribution_valid

if __name__ == '__main__':
    import sys
    
    try:
        success = test_distribution()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}\n")
        sys.exit(1)
