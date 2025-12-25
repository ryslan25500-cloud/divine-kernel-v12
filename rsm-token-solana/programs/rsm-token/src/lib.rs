use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{clock::Clock, Sysvar},
};

pub const MAX_SUPPLY: u64 = 100_000_666_000_000_000;
pub const DECIMALS: u8 = 9;

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = RSMInstruction::try_from_slice(instruction_data)?;
    match instruction {
        RSMInstruction::Initialize { max_supply, agi_controller } => {
            process_initialize(program_id, accounts, max_supply, agi_controller)
        }
        RSMInstruction::MintFromGenome { genome_hash, complexity, uniqueness, entropy, amount } => {
            process_mint_from_genome(program_id, accounts, genome_hash, complexity, uniqueness, entropy, amount)
        }
        RSMInstruction::BurnGenome { genome_hash } => {
            process_burn_genome(program_id, accounts, genome_hash)
        }
        RSMInstruction::UpdateAGIParams { complexity_weight, uniqueness_weight, entropy_weight, blockchain_weight } => {
            process_update_agi_params(program_id, accounts, complexity_weight, uniqueness_weight, entropy_weight, blockchain_weight)
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum RSMInstruction {
    Initialize {
        max_supply: u64,
        agi_controller: Pubkey,
    },
    MintFromGenome {
        genome_hash: [u8; 32],
        complexity: u8,
        uniqueness: u8,
        entropy: u16,
        amount: u64,
    },
    BurnGenome {
        genome_hash: [u8; 32],
    },
    UpdateAGIParams {
        complexity_weight: u8,
        uniqueness_weight: u8,
        entropy_weight: u8,
        blockchain_weight: u8,
    },
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct TokenConfig {
    pub authority: Pubkey,
    pub agi_controller: Pubkey,
    pub max_supply: u64,
    pub total_minted: u64,
    pub agi_params: AGIParameters,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Copy)]
pub struct AGIParameters {
    pub complexity_weight: u8,
    pub uniqueness_weight: u8,
    pub entropy_weight: u8,
    pub blockchain_weight: u8,
    pub last_update: i64,
}

impl Default for AGIParameters {
    fn default() -> Self {
        Self {
            complexity_weight: 40,
            uniqueness_weight: 30,
            entropy_weight: 20,
            blockchain_weight: 10,
            last_update: 0,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GenomeData {
    pub hash: [u8; 32],
    pub owner: Pubkey,
    pub tokens_minted: u64,
    pub complexity: u8,
    pub uniqueness: u8,
    pub is_minted: bool,
    pub mint_timestamp: i64,
}

pub fn process_initialize(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    max_supply: u64,
    agi_controller: Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let config_account = next_account_info(account_info_iter)?;
    let authority = next_account_info(account_info_iter)?;
    
    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let config = TokenConfig {
        authority: *authority.key,
        agi_controller,
        max_supply,
        total_minted: 0,
        agi_params: AGIParameters::default(),
    };
    
    config.serialize(&mut &mut config_account.data.borrow_mut()[..])?;
    msg!("RSM Token initialized with max supply: {}", max_supply);
    
    Ok(())
}

pub fn process_mint_from_genome(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    genome_hash: [u8; 32],
    complexity: u8,
    uniqueness: u8,
    entropy: u16,
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let config_account = next_account_info(account_info_iter)?;
    let genome_account = next_account_info(account_info_iter)?;
    let _mint_account = next_account_info(account_info_iter)?;
    let recipient_account = next_account_info(account_info_iter)?;
    let agi_controller = next_account_info(account_info_iter)?;
    let _token_program = next_account_info(account_info_iter)?;
    let clock_sysvar = next_account_info(account_info_iter)?;
    
    if !agi_controller.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let mut config = TokenConfig::try_from_slice(&config_account.data.borrow())?;
    
    if *agi_controller.key != config.agi_controller {
        return Err(ProgramError::InvalidAccountData);
    }
    
    if complexity > 100 || uniqueness > 100 || entropy > 200 {
        return Err(ProgramError::InvalidArgument);
    }
    
    let clock = Clock::from_account_info(clock_sysvar)?;
    let calculated_amount = calculate_token_amount(&config.agi_params, complexity, uniqueness, entropy, clock.slot);
    
    if amount != calculated_amount {
        msg!("Amount mismatch: expected {}, got {}", calculated_amount, amount);
        return Err(ProgramError::InvalidArgument);
    }
    
    if config.total_minted + amount > config.max_supply {
        return Err(ProgramError::InvalidArgument);
    }
    
    let genome_data = GenomeData {
        hash: genome_hash,
        owner: *recipient_account.key,
        tokens_minted: amount,
        complexity,
        uniqueness,
        is_minted: true,
        mint_timestamp: clock.unix_timestamp,
    };
    
    genome_data.serialize(&mut &mut genome_account.data.borrow_mut()[..])?;
    config.total_minted += amount;
    config.serialize(&mut &mut config_account.data.borrow_mut()[..])?;
    
    msg!("Minted {} RSM tokens for genome", amount);
    
    Ok(())
}

pub fn process_burn_genome(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    genome_hash: [u8; 32],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let config_account = next_account_info(account_info_iter)?;
    let genome_account = next_account_info(account_info_iter)?;
    let _mint_account = next_account_info(account_info_iter)?;
    let _owner_token_account = next_account_info(account_info_iter)?;
    let owner = next_account_info(account_info_iter)?;
    
    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let mut config = TokenConfig::try_from_slice(&config_account.data.borrow())?;
    let genome_data = GenomeData::try_from_slice(&genome_account.data.borrow())?;
    
    if genome_data.hash != genome_hash || genome_data.owner != *owner.key {
        return Err(ProgramError::IllegalOwner);
    }
    
    config.total_minted -= genome_data.tokens_minted;
    config.serialize(&mut &mut config_account.data.borrow_mut()[..])?;
    
    msg!("Burned {} RSM tokens", genome_data.tokens_minted);
    Ok(())
}

pub fn process_update_agi_params(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    complexity_weight: u8,
    uniqueness_weight: u8,
    entropy_weight: u8,
    blockchain_weight: u8,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let config_account = next_account_info(account_info_iter)?;
    let agi_controller = next_account_info(account_info_iter)?;
    
    if !agi_controller.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let mut config = TokenConfig::try_from_slice(&config_account.data.borrow())?;
    
    if *agi_controller.key != config.agi_controller {
        return Err(ProgramError::InvalidAccountData);
    }
    
    if complexity_weight + uniqueness_weight + entropy_weight + blockchain_weight != 100 {
        return Err(ProgramError::InvalidArgument);
    }
    
    config.agi_params.complexity_weight = complexity_weight;
    config.agi_params.uniqueness_weight = uniqueness_weight;
    config.agi_params.entropy_weight = entropy_weight;
    config.agi_params.blockchain_weight = blockchain_weight;
    config.serialize(&mut &mut config_account.data.borrow_mut()[..])?;
    
    msg!("AGI parameters updated");
    Ok(())
}

pub fn calculate_token_amount(
    params: &AGIParameters,
    complexity: u8,
    uniqueness: u8,
    entropy: u16,
    slot: u64,
) -> u64 {
    let weighted_score = 
        (complexity as u64 * params.complexity_weight as u64) +
        (uniqueness as u64 * params.uniqueness_weight as u64) +
        (entropy as u64 * params.entropy_weight as u64 / 2) +
        ((slot % 100) * params.blockchain_weight as u64);
    
    let base_amount = (weighted_score * 1_000_000_000_000) / 100_000;
    
    if complexity >= 90 && uniqueness >= 90 {
        base_amount * 150 / 100
    } else if complexity >= 80 && uniqueness >= 80 {
        base_amount * 125 / 100
    } else {
        base_amount
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_max_supply() {
        let max_rsm = MAX_SUPPLY / 10_u64.pow(DECIMALS as u32);
        assert_eq!(max_rsm, 100_000_666);
        println!("Max RSM Supply: {}", max_rsm);
    }
    
    #[test]
    fn test_agi_high() {
        let params = AGIParameters::default();
        let amt = calculate_token_amount(&params, 95, 90, 198, 12345);
        assert!(amt > 100_000_000_000);
        println!("High quality: {} RSM", amt / 1_000_000_000);
    }
    
    #[test]
    fn test_agi_medium() {
        let params = AGIParameters::default();
        let amt = calculate_token_amount(&params, 50, 50, 100, 12345);
        assert!(amt > 10_000_000_000);
        println!("Medium quality: {} RSM", amt / 1_000_000_000);
    }
    
    #[test]
    fn test_agi_low() {
        let params = AGIParameters::default();
        let amt = calculate_token_amount(&params, 20, 20, 40, 12345);
        println!("Low quality: {} RSM", amt / 1_000_000_000);
    }
    
    #[test]
    fn test_bonus() {
        let params = AGIParameters::default();
        let exc = calculate_token_amount(&params, 95, 95, 198, 12345);
        let good = calculate_token_amount(&params, 85, 85, 170, 12345);
        let norm = calculate_token_amount(&params, 75, 75, 150, 12345);
        assert!(exc > good && good > norm);
        println!("Exceptional: {} RSM", exc / 1_000_000_000);
        println!("Good: {} RSM", good / 1_000_000_000);
        println!("Normal: {} RSM", norm / 1_000_000_000);
    }
}