use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::drop::Drop;
use crate::state::claim_record::ClaimRecord;
use crate::errors::LootDropError;

#[derive(Accounts)]
pub struct ClaimDrop<'info> {
    #[account(
        mut,
        seeds = [b"drop", drop.creator.as_ref(), &drop.uuid],
        bump = drop.bump
    )]
    pub drop: Account<'info, Drop>,

    #[account(
        init,
        payer = claimer,
        space = ClaimRecord::LEN,
        seeds = [b"claim", drop.key().as_ref(), claimer.key().as_ref()],
        bump
    )]
    pub claim_record: Account<'info, ClaimRecord>,

    /// CHECK: PDA vault holding the escrowed SOL
    #[account(
        mut,
        seeds = [b"vault", drop.key().as_ref()],
        bump = drop.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub claimer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimDrop>, distance_cm: u32) -> Result<()> {
    let clock = Clock::get()?;
    let drop = &mut ctx.accounts.drop;

    // Validations
    require!(drop.is_active, LootDropError::DropInactive);
    require!(clock.unix_timestamp < drop.expires_at, LootDropError::DropExpired);
    require!(drop.current_claims < drop.max_claims, LootDropError::DropFullyClaimed);

    // For SOL drops: transfer per-claimer share from vault to claimer
    if drop.asset_type == 0 {
        let payout = drop.asset_amount / drop.max_claims as u64;
        let drop_key = drop.key();
        let vault_seeds: &[&[u8]] = &[b"vault", drop_key.as_ref(), &[drop.vault_bump]];
        let signer_seeds = &[vault_seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.claimer.to_account_info(),
                },
                signer_seeds,
            ),
            payout,
        )?;
    }

    // Record the claim
    let claim_record = &mut ctx.accounts.claim_record;
    claim_record.drop = drop.key();
    claim_record.claimer = *ctx.accounts.claimer.key;
    claim_record.claimed_at = clock.unix_timestamp;
    claim_record.distance_cm = distance_cm;

    // Update drop state
    drop.current_claims += 1;
    if drop.current_claims >= drop.max_claims {
        drop.is_active = false;
    }

    Ok(())
}
