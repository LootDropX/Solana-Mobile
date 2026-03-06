use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::create_drop::*;
use instructions::claim_drop::*;
use instructions::expire_drop::*;

declare_id!("3C5Sozfd3P2QSR3sehg8y3EErsZTpegVK1GAKbuYRN4n");

#[program]
pub mod lootdrop {
    use super::*;

    /// Creates a new loot drop and (for SOL drops) escrows the reward in the vault PDA.
    pub fn create_drop(
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
        instructions::create_drop::handler(
            ctx,
            uuid,
            title,
            description,
            latitude,
            longitude,
            rarity_tier,
            asset_type,
            asset_amount,
            max_claims,
            expires_at,
        )
    }

    /// Claims a loot drop, validating active state and transferring the reward.
    pub fn claim_drop(ctx: Context<ClaimDrop>, distance_cm: u32) -> Result<()> {
        instructions::claim_drop::handler(ctx, distance_cm)
    }

    /// Expires a drop, returning escrowed funds to the creator.
    pub fn expire_drop(ctx: Context<ExpireDrop>) -> Result<()> {
        instructions::expire_drop::handler(ctx)
    }
}
