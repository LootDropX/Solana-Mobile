use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::drop::Drop;
use crate::errors::LootDropError;

#[derive(Accounts)]
#[instruction(uuid: [u8; 16])]
pub struct CreateDrop<'info> {
    #[account(
        init,
        payer = creator,
        space = Drop::LEN,
        seeds = [b"drop", creator.key().as_ref(), &uuid],
        bump
    )]
    pub drop: Account<'info, Drop>,

    /// CHECK: PDA vault — holds escrowed SOL
    #[account(
        mut,
        seeds = [b"vault", drop.key().as_ref()],
        bump
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateDrop>,
    uuid: [u8; 16],
    title: String,
    description: String,
    latitude: i64,
    longitude: i64,
    rarity_tier: u8,
    asset_type: u8,
    asset_amount: u64,
    max_claims: u16,
    expires_at: i64,
) -> Result<()> {
    let clock = Clock::get()?;

    // Validations
    require!(title.len() <= 50, LootDropError::TitleTooLong);
    require!(description.len() <= 200, LootDropError::DescriptionTooLong);
    require!(expires_at > clock.unix_timestamp, LootDropError::DropExpired);
    require!(asset_amount > 0, LootDropError::InvalidAmount);
    require!(max_claims > 0, LootDropError::InvalidMaxClaims);
    require!(
        latitude.abs() <= 90_000_000 && longitude.abs() <= 180_000_000,
        LootDropError::InvalidCoordinates
    );

    let drop = &mut ctx.accounts.drop;
    drop.creator = *ctx.accounts.creator.key;
    drop.uuid = uuid;
    drop.title = title;
    drop.description = description;
    drop.latitude = latitude;
    drop.longitude = longitude;
    drop.rarity_tier = rarity_tier;
    drop.asset_type = asset_type;
    drop.asset_amount = asset_amount;
    drop.mint_address = None;
    drop.max_claims = max_claims;
    drop.current_claims = 0;
    drop.expires_at = expires_at;
    drop.is_active = true;
    drop.vault_bump = ctx.bumps.vault;
    drop.bump = ctx.bumps.drop;

    // For SOL drops: transfer asset_amount to vault
    if asset_type == 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.creator.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            asset_amount,
        )?;
    }

    Ok(())
}
