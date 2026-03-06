use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::drop::Drop;
use crate::errors::LootDropError;

#[derive(Accounts)]
pub struct ExpireDrop<'info> {
    #[account(
        mut,
        seeds = [b"drop", drop.creator.as_ref(), &drop.uuid],
        bump = drop.bump
    )]
    pub drop: Account<'info, Drop>,

    /// CHECK: PDA vault holding the escrowed SOL
    #[account(
        mut,
        seeds = [b"vault", drop.key().as_ref()],
        bump = drop.vault_bump
    )]
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ExpireDrop>) -> Result<()> {
    let clock = Clock::get()?;
    let drop = &mut ctx.accounts.drop;

    // Only creator or after expiry
    let is_creator = ctx.accounts.creator.key == &drop.creator;
    let is_expired = clock.unix_timestamp >= drop.expires_at;
    require!(is_creator || is_expired, LootDropError::DropInactive);

    // Return remaining vault balance to creator
    let vault_balance = ctx.accounts.vault.lamports();
    if vault_balance > 0 {
        let drop_key = drop.key();
        let vault_seeds: &[&[u8]] = &[b"vault", drop_key.as_ref(), &[drop.vault_bump]];
        let signer_seeds = &[vault_seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
                signer_seeds,
            ),
            vault_balance,
        )?;
    }

    drop.is_active = false;
    Ok(())
}
