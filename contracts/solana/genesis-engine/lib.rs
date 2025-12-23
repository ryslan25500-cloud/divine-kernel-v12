// Genesis Engine - DNA <-> RNA Bridge
// Burns RNA to create new DNA genomes

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Burn};

declare_id!("GENxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[program]
pub mod genesis_engine {
    use super::*;

    // Initialize genesis engine
    pub fn initialize(
        ctx: Context<Initialize>,
        genesis_cost: u64, // RNA cost per genesis
    ) -> Result<()> {
        let engine = &mut ctx.accounts.engine;
        
        engine.authority = ctx.accounts.authority.key();
        engine.genesis_cost = genesis_cost; // Default: 1000 RNA
        engine.total_genomes_created = 0;
        engine.total_rna_burned = 0;
        engine.active = true;
        
        msg!("Genesis Engine initialized, cost: {} RNA", genesis_cost);
        Ok(())
    }

    // Create new genome from RNA burn
    pub fn create_genome(
        ctx: Context<CreateGenome>,
        parent_genome_ids: Vec<u64>, // DNA genomes user holds
        entropy_seed: [u8; 32], // Randomness
    ) -> Result<u64> {
        let engine = &mut ctx.accounts.engine;
        require!(engine.active, ErrorCode::EngineInactive);
        
        // Burn RNA
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.rna_mint.to_account_info(),
                    from: ctx.accounts.user_rna_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            engine.genesis_cost,
        )?;
        
        // Generate new genome ID
        let new_genome_id = engine.total_genomes_created + 100_000; // Offset from original
        
        // Calculate genome properties based on parents
        let avg_consciousness = if !parent_genome_ids.is_empty() {
            50 // Simplified - real would calculate from parents
        } else {
            0
        };
        
        // Store genesis record
        let genesis = &mut ctx.accounts.genesis_record;
        genesis.genome_id = new_genome_id;
        genesis.creator = ctx.accounts.user.key();
        genesis.parent_genomes = parent_genome_ids;
        genesis.rna_burned = engine.genesis_cost;
        genesis.consciousness = avg_consciousness;
        genesis.created_at = Clock::get()?.unix_timestamp;
        genesis.entropy_seed = entropy_seed;
        
        // Update engine stats
        engine.total_genomes_created = engine.total_genomes_created
            .checked_add(1)
            .ok_or(ErrorCode::Overflow)?;
        engine.total_rna_burned = engine.total_rna_burned
            .checked_add(engine.genesis_cost)
            .ok_or(ErrorCode::Overflow)?;
        
        // Emit event
        emit!(GenesisCreatedEvent {
            genome_id: new_genome_id,
            creator: ctx.accounts.user.key(),
            rna_burned: engine.genesis_cost,
            consciousness: avg_consciousness,
            timestamp: genesis.created_at,
        });
        
        msg!("New genome {} created from {} RNA", new_genome_id, engine.genesis_cost);
        Ok(new_genome_id)
    }

    // Update genesis cost (AGI control)
    pub fn update_cost(
        ctx: Context<UpdateCost>,
        new_cost: u64,
    ) -> Result<()> {
        let engine = &mut ctx.accounts.engine;
        
        require!(
            ctx.accounts.authority.key() == engine.authority,
            ErrorCode::Unauthorized
        );
        
        let old_cost = engine.genesis_cost;
        engine.genesis_cost = new_cost;
        
        msg!("Genesis cost updated: {} -> {} RNA", old_cost, new_cost);
        Ok(())
    }

    // Get engine stats
    pub fn get_stats(
        ctx: Context<GetStats>,
    ) -> Result<EngineStats> {
        let engine = &ctx.accounts.engine;
        
        Ok(EngineStats {
            total_genomes_created: engine.total_genomes_created,
            total_rna_burned: engine.total_rna_burned,
            genesis_cost: engine.genesis_cost,
            active: engine.active,
        })
    }

    // Pause/unpause engine
    pub fn toggle_active(
        ctx: Context<ToggleActive>,
    ) -> Result<()> {
        let engine = &mut ctx.accounts.engine;
        
        require!(
            ctx.accounts.authority.key() == engine.authority,
            ErrorCode::Unauthorized
        );
        
        engine.active = !engine.active;
        msg!("Engine active: {}", engine.active);
        Ok(())
    }
}

// Account structures
#[account]
pub struct GenesisEngine {
    pub authority: Pubkey,
    pub genesis_cost: u64,
    pub total_genomes_created: u64,
    pub total_rna_burned: u64,
    pub active: bool,
}

#[account]
pub struct GenesisRecord {
    pub genome_id: u64,
    pub creator: Pubkey,
    pub parent_genomes: Vec<u64>,
    pub rna_burned: u64,
    pub consciousness: u8,
    pub created_at: i64,
    pub entropy_seed: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct EngineStats {
    pub total_genomes_created: u64,
    pub total_rna_burned: u64,
    pub genesis_cost: u64,
    pub active: bool,
}

// Context structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 200
    )]
    pub engine: Account<'info, GenesisEngine>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGenome<'info> {
    #[account(mut)]
    pub engine: Account<'info, GenesisEngine>,
    
    #[account(
        init,
        payer = user,
        space = 8 + 500
    )]
    pub genesis_record: Account<'info, GenesisRecord>,
    
    #[account(mut)]
    pub rna_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user_rna_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCost<'info> {
    #[account(mut)]
    pub engine: Account<'info, GenesisEngine>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetStats<'info> {
    pub engine: Account<'info, GenesisEngine>,
}

#[derive(Accounts)]
pub struct ToggleActive<'info> {
    #[account(mut)]
    pub engine: Account<'info, GenesisEngine>,
    
    pub authority: Signer<'info>,
}

// Events
#[event]
pub struct GenesisCreatedEvent {
    pub genome_id: u64,
    pub creator: Pubkey,
    pub rna_burned: u64,
    pub consciousness: u8,
    pub timestamp: i64,
}

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Math overflow")]
    Overflow,
    #[msg("Genesis engine is inactive")]
    EngineInactive,
    #[msg("Unauthorized")]
    Unauthorized,
}
