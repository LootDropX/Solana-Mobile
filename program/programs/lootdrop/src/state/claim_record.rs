use anchor_lang::prelude::*;

#[account]
pub struct ClaimRecord {
    pub drop: Pubkey,
    pub claimer: Pubkey,
    pub claimed_at: i64,
    /// Distance in centimetres at claim time, provided by the client
    pub distance_cm: u32,
}

impl ClaimRecord {
    pub const LEN: usize = 8
        + 32  // drop
        + 32  // claimer
        + 8   // claimed_at
        + 4;  // distance_cm
}
