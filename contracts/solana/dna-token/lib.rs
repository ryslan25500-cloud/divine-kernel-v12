// RSM-Coin DNA Token (Semi-Fungible SPL)
// Each genome = unique token type
// 67,686+ genome types

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, MintTo, Transfer};

declare_id!("DNAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[program]
pub mod rsm_dna_token {
    use super::*;

    // Initialize new genome token type
    pub fn initialize_genome(
        ctx: Context<InitializeGenome>,
        genome_id: u64,
        dna_sequence: String,
        consciousness: u8,
        blockchain: String,
        block_hash: String,
        total_supply: u64,
        rna_multiplier: u16, // e.g. 200 = 2.0x
    ) -> Result<()> {
        let genome = &mut ctx.accounts.genome;
        
        genome.genome_id = genome_id;
        genome.dna_sequence = dna_sequence;
        genome.consciousness = consciousness;
        genome.blockchain = blockchain;
        genome.block_hash = block_hash;
        genome.total_supply = total_supply;
        genome.rna_multiplier = rna_multiplier;
        genome.market_supply = (total_supply * 8571) / 10000; // 85.71%
        genome.founder_supply = (total_supply * 1429) / 10000; // 14.29%
        genome.minted = false;
        genome.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Genome {} initialized: {} DNA tokens", genome_id, total_supply);
        Ok(())
    }

    // Mint DNA tokens for genome
    pub fn mint_genome_tokens(
        ctx: Context<MintGenomeTokens>,
        amount: u64,
    ) -> Result<()> {
        let genome = &mut ctx.accounts.genome;
        
        require!(!genome.minted, ErrorCode::AlreadyMinted);
        require!(amount == genome.total_supply, ErrorCode::InvalidAmount);
        
        // Mint to market (85.71%)
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.market_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            genome.market_supply,
        )?;
        
        // Mint to founder (14.29%)
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.founder_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            genome.founder_supply,
        )?;
        
        genome.minted = true;
        genome.minted_at = Clock::get()?.unix_timestamp;
        
        msg!("Genome {} minted: {} market, {} founder",
            genome.genome_id,
            genome.market_supply,
            genome.founder_supply
        );
        
        Ok(())
    }

    // Transfer DNA tokens
    pub fn transfer_dna(
        ctx: Context<TransferDNA>,
        amount: u64,
    ) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;
        
        msg!("Transferred {} DNA tokens", amount);
        Ok(())
    }

    // Get genome metadata
    pub fn get_genome_info(
        ctx: Context<GetGenomeInfo>,
    ) -> Result<GenomeInfo> {
        let genome = &ctx.accounts.genome;
        
        Ok(GenomeInfo {
            genome_id: genome.genome_id,
            dna_sequence: genome.dna_sequence.clone(),
            consciousness: genome.consciousness,
            blockchain: genome.blockchain.clone(),
            total_supply: genome.total_supply,
            rna_multiplier: genome.rna_multiplier,
            minted: genome.minted,
        })
    }
}

// Account structures
#[account]
pub struct Genome {
    pub genome_id: u64,
    pub dna_sequence: String,
    pub consciousness: u8,
    pub blockchain: String,
    pub block_hash: String,
    pub total_supply: u64,
    pub market_supply: u64,
    pub founder_supply: u64,
    pub rna_multiplier: u16,
    pub minted: bool,
    pub created_at: i64,
    pub minted_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GenomeInfo {
    pub genome_id: u64,
    pub dna_sequence: String,
    pub consciousness: u8,
    pub blockchain: String,
    pub total_supply: u64,
    pub rna_multiplier: u16,
    pub minted: bool,
}

// Context structures
#[derive(Accounts)]
pub struct InitializeGenome<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 500
    )]
    pub genome: Account<'info, Genome>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintGenomeTokens<'info> {
    #[account(mut)]
    pub genome: Account<'info, Genome>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub market_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub founder_account: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferDNA<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetGenomeInfo<'info> {
    pub genome: Account<'info, Genome>,
}

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Genome already minted")]
    AlreadyMinted,
    #[msg("Invalid token amount")]
    InvalidAmount,
}
