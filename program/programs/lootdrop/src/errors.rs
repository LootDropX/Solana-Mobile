use anchor_lang::prelude::*;

#[error_code]
pub enum LootDropError {
    #[msg("The drop has expired")]
    DropExpired,
    #[msg("All claims have been taken")]
    DropFullyClaimed,
    #[msg("You have already claimed this drop")]
    AlreadyClaimed,
    #[msg("This drop is no longer active")]
    DropInactive,
    #[msg("Invalid coordinate values")]
    InvalidCoordinates,
    #[msg("Title exceeds 50 characters")]
    TitleTooLong,
    #[msg("Description exceeds 200 characters")]
    DescriptionTooLong,
    #[msg("Asset amount must be greater than zero")]
    InvalidAmount,
    #[msg("Max claims must be greater than zero")]
    InvalidMaxClaims,
}
