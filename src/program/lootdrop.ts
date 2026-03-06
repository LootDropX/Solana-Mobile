import type { Idl } from '@coral-xyz/anchor';

/**
 * Auto-generated Anchor IDL types for the LootDrop program.
 * Regenerate with: `anchor build && anchor idl fetch <PROGRAM_ID>`
 */
export const LOOTDROP_IDL = {
  "address": "3C5Sozfd3P2QSR3sehg8y3EErsZTpegVK1GAKbuYRN4n",
  "metadata": {
    "name": "lootdrop",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "LootDrop on-chain program"
  },
  "instructions": [
    {
      "name": "claim_drop",
      "docs": [
        "Claims a loot drop, validating active state and transferring the reward."
      ],
      "discriminator": [
        157,
        29,
        89,
        14,
        81,
        203,
        107,
        58
      ],
      "accounts": [
        {
          "name": "drop",
          "writable": true
        },
        {
          "name": "claim_record",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  105,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "drop"
              },
              {
                "kind": "account",
                "path": "claimer"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "drop"
              }
            ]
          }
        },
        {
          "name": "claimer",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "distance_cm",
          "type": "u32"
        }
      ]
    },
    {
      "name": "create_drop",
      "docs": [
        "Creates a new loot drop and (for SOL drops) escrows the reward in the vault PDA."
      ],
      "discriminator": [
        157,
        142,
        145,
        247,
        92,
        73,
        59,
        48
      ],
      "accounts": [
        {
          "name": "drop",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  114,
                  111,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "uuid"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "drop"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "uuid",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "latitude",
          "type": "i64"
        },
        {
          "name": "longitude",
          "type": "i64"
        },
        {
          "name": "rarity_tier",
          "type": "u8"
        },
        {
          "name": "asset_type",
          "type": "u8"
        },
        {
          "name": "asset_amount",
          "type": "u64"
        },
        {
          "name": "max_claims",
          "type": "u16"
        },
        {
          "name": "expires_at",
          "type": "i64"
        }
      ]
    },
    {
      "name": "expire_drop",
      "docs": [
        "Expires a drop, returning escrowed funds to the creator."
      ],
      "discriminator": [
        185,
        58,
        139,
        251,
        235,
        242,
        67,
        104
      ],
      "accounts": [
        {
          "name": "drop",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "drop"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "ClaimRecord",
      "discriminator": [
        57,
        229,
        0,
        9,
        65,
        62,
        96,
        7
      ]
    },
    {
      "name": "Drop",
      "discriminator": [
        56,
        174,
        80,
        200,
        182,
        146,
        223,
        35
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "DropExpired",
      "msg": "The drop has expired"
    },
    {
      "code": 6001,
      "name": "DropFullyClaimed",
      "msg": "All claims have been taken"
    },
    {
      "code": 6002,
      "name": "AlreadyClaimed",
      "msg": "You have already claimed this drop"
    },
    {
      "code": 6003,
      "name": "DropInactive",
      "msg": "This drop is no longer active"
    },
    {
      "code": 6004,
      "name": "InvalidCoordinates",
      "msg": "Invalid coordinate values"
    },
    {
      "code": 6005,
      "name": "TitleTooLong",
      "msg": "Title exceeds 50 characters"
    },
    {
      "code": 6006,
      "name": "DescriptionTooLong",
      "msg": "Description exceeds 200 characters"
    },
    {
      "code": 6007,
      "name": "InvalidAmount",
      "msg": "Asset amount must be greater than zero"
    },
    {
      "code": 6008,
      "name": "InvalidMaxClaims",
      "msg": "Max claims must be greater than zero"
    }
  ],
  "types": [
    {
      "name": "ClaimRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "drop",
            "type": "pubkey"
          },
          {
            "name": "claimer",
            "type": "pubkey"
          },
          {
            "name": "claimed_at",
            "type": "i64"
          },
          {
            "name": "distance_cm",
            "docs": [
              "Distance in centimetres at claim time, provided by the client"
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "Drop",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "uuid",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "latitude",
            "docs": [
              "Stored as lat * 1_000_000 (e.g. 37.774929 → 37774929)"
            ],
            "type": "i64"
          },
          {
            "name": "longitude",
            "docs": [
              "Stored as lng * 1_000_000"
            ],
            "type": "i64"
          },
          {
            "name": "rarity_tier",
            "type": "u8"
          },
          {
            "name": "asset_type",
            "type": "u8"
          },
          {
            "name": "asset_amount",
            "type": "u64"
          },
          {
            "name": "mint_address",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "max_claims",
            "type": "u16"
          },
          {
            "name": "current_claims",
            "type": "u16"
          },
          {
            "name": "expires_at",
            "type": "i64"
          },
          {
            "name": "is_active",
            "type": "bool"
          },
          {
            "name": "vault_bump",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
} as const;

export type LootdropProgram = typeof LOOTDROP_IDL;
