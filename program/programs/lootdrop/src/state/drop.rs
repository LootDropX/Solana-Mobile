use anchor_lang::prelude::*;

#[account]
pub struct Drop {
    pub creator: Pubkey,
    pub uuid: [u8; 16],
    pub title: String,       // max 50 chars
    pub description: String, // max 200 chars
    /// Stored as lat * 1_000_000 (e.g. 37.774929 → 37774929)
    pub latitude: i64,
    /// Stored as lng * 1_000_000
    pub longitude: i64,
    pub rarity_tier: u8,     // 0=Common, 1=Rare, 2=Epic, 3=Legendary
    pub asset_type: u8,      // 0=SOL, 1=SPL_TOKEN, 2=NFT
    pub asset_amount: u64,   // lamports for SOL, raw amount for tokens
    pub mint_address: Option<Pubkey>,
    pub max_claims: u16,
    pub current_claims: u16,
    pub expires_at: i64,     // unix timestamp
    pub is_active: bool,
    pub vault_bump: u8,
    pub bump: u8,
}

impl Drop {
    /// Space: discriminator + fields
    pub const LEN: usize = 8
        + 32        // creator
        + 16        // uuid
        + 4 + 50    // title (len prefix + max bytes)
        + 4 + 200   // description
        + 8         // latitude
        + 8         // longitude
        + 1         // rarity_tier
        + 1         // asset_type
        + 8         // asset_amount
        + 1 + 32    // mint_address Option<Pubkey>
        + 2         // max_claims
        + 2         // current_claims
        + 8         // expires_at
        + 1         // is_active
        + 1         // vault_bump
        + 1;        // bump
}
