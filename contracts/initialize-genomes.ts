// Initialize 1000 genome tokens from CSV
import * as fs from 'fs';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

interface GenomeData {
    id: number;
    blockchain: string;
    consciousness: number;
    total_supply: number;
    market_supply: number;
    founder_supply: number;
    dna_tetrad: string;
    block_hash: string;
    block_height: number;
}

async function loadGenomesFromCSV(filepath: string): Promise<GenomeData[]> {
    const csv = fs.readFileSync(filepath, 'utf-8');
    const lines = csv.split('\n').slice(1); // Skip header
    
    return lines.map(line => {
        const [id, blockchain, consciousness, total, market, founder, dna, hash, height] = line.split(',');
        return {
            id: parseInt(id),
            blockchain: blockchain || 'unknown',
            consciousness: parseInt(consciousness) || 0,
            total_supply: Math.floor(parseFloat(total) * 1e9), // Convert to lamports
            market_supply: Math.floor(parseFloat(market) * 1e9),
            founder_supply: Math.floor(parseFloat(founder) * 1e9),
            dna_tetrad: dna,
            block_hash: hash,
            block_height: parseInt(height) || 0,
        };
    });
}

async function initializeGenomes() {
    console.log('🧬 Initializing 1000 genome tokens...\n');
    
    // Setup
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    
    // Load program
    const programId = new PublicKey('DNAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    const idl = JSON.parse(fs.readFileSync('./target/idl/rsm_dna_token.json', 'utf-8'));
    const program = new Program(idl, programId, provider);
    
    // Load genomes
    const genomes = await loadGenomesFromCSV('/tmp/top_1000_genomes.csv');
    console.log(`✅ Loaded ${genomes.length} genomes\n`);
    
    // Initialize each genome
    let success = 0;
    let failed = 0;
    
    for (const genome of genomes) {
        try {
            // Calculate RNA multiplier (consciousness bonus)
            const rnaMultiplier = Math.floor((1 + genome.consciousness / 100) * 100); // e.g. 200 = 2.0x
            
            const tx = await program.methods
                .initializeGenome(
                    new anchor.BN(genome.id),
                    genome.dna_tetrad,
                    genome.consciousness,
                    genome.blockchain,
                    genome.block_hash,
                    new anchor.BN(genome.total_supply),
                    rnaMultiplier
                )
                .rpc();
            
            success++;
            console.log(`✅ Genome ${genome.id}: ${genome.total_supply / 1e9} RSM (C=${genome.consciousness})`);
            
            // Rate limit
            if (success % 10 === 0) {
                console.log(`\n📊 Progress: ${success}/${genomes.length}\n`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            failed++;
            console.error(`❌ Genome ${genome.id} failed:`, error.message);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${genomes.length}`);
    console.log('='.repeat(50) + '\n');
}

initializeGenomes().catch(console.error);
