/**
 * Seed script — creates realistic drops on Solana Devnet + Supabase at major crypto event locations.
 *
 * Usage:
 *   export $(cat .env | grep -v '^#' | xargs) && npx ts-node scripts/seed-devnet-drops.ts
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

// ── Config ──────────────────────────────────────────────────────────────────
const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.EXPO_PUBLIC_PROGRAM_ID ?? '3C5Sozfd3P2QSR3sehg8y3EErsZTpegVK1GAKbuYRN4n';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function generateRandomOffset(baseCoord: number, maxOffset = 0.005): number {
  const sign = Math.random() > 0.5 ? 1 : -1;
  return baseCoord + (Math.random() * maxOffset * sign);
}

// ── Event Locations ──────────────────────────────────────────────────────────
const EVENTS = {
  breakpointSingapore: { lat: 1.2935, lng: 103.8572 },     // Suntec City
  ethDenver: { lat: 39.7744, lng: -104.9782 },             // National Western Complex
  token2049Dubai: { lat: 25.1328, lng: 55.1843 },          // Madinat Jumeirah
  consensusAustin: { lat: 30.2644, lng: -97.7397 },        // Austin Convention Center
  devconBangkok: { lat: 13.7251, lng: 100.5599 },          // QSNCC
  koreaBlockchainWeek: { lat: 37.5112, lng: 127.0628 },    // COEX
  ethCCParis: { lat: 48.8415, lng: 2.3488 },               // Maison de la Mutualité
  miamiCrypto: { lat: 25.7906, lng: -80.1300 },            // Miami Beach Convention Center
  hackerHouseLondon: { lat: 51.5284, lng: -0.0849 },       // Shoreditch, London
  hackerHouseNY: { lat: 40.7484, lng: -73.9857 },          // Empire State Building area
};

// ── Demo drop definitions ────────────────────────────────────────────────────
const DEMO_DROPS = [
  // Solana Breakpoint (Singapore)
  { title: 'Breakpoint Badge', rarity: 0, sol: 0.005, lat: generateRandomOffset(EVENTS.breakpointSingapore.lat), lng: generateRandomOffset(EVENTS.breakpointSingapore.lng) },
  { title: 'Firedancer Node', rarity: 2, sol: 0.25, lat: generateRandomOffset(EVENTS.breakpointSingapore.lat), lng: generateRandomOffset(EVENTS.breakpointSingapore.lng) },
  { title: 'Suntec Vault', rarity: 3, sol: 1.5, lat: EVENTS.breakpointSingapore.lat, lng: EVENTS.breakpointSingapore.lng },

  // ETHDenver (Colorado)
  { title: 'Spork Shard', rarity: 0, sol: 0.003, lat: generateRandomOffset(EVENTS.ethDenver.lat), lng: generateRandomOffset(EVENTS.ethDenver.lng) },
  { title: 'Bufficorn Relic', rarity: 1, sol: 0.05, lat: generateRandomOffset(EVENTS.ethDenver.lat), lng: generateRandomOffset(EVENTS.ethDenver.lng) },

  // Token2049 (Dubai)
  { title: 'Desert Mirage', rarity: 0, sol: 0.008, lat: generateRandomOffset(EVENTS.token2049Dubai.lat), lng: generateRandomOffset(EVENTS.token2049Dubai.lng) },
  { title: 'Jumeirah Gold', rarity: 2, sol: 0.35, lat: generateRandomOffset(EVENTS.token2049Dubai.lat), lng: generateRandomOffset(EVENTS.token2049Dubai.lng) },

  // Consensus (Austin)
  { title: 'Bat City Signal', rarity: 0, sol: 0.004, lat: generateRandomOffset(EVENTS.consensusAustin.lat), lng: generateRandomOffset(EVENTS.consensusAustin.lng) },
  { title: 'Sixth Street Cache', rarity: 1, sol: 0.07, lat: generateRandomOffset(EVENTS.consensusAustin.lat), lng: generateRandomOffset(EVENTS.consensusAustin.lng) },

  // Devcon 7 (Bangkok)
  { title: 'Siam Matrix', rarity: 1, sol: 0.04, lat: generateRandomOffset(EVENTS.devconBangkok.lat), lng: generateRandomOffset(EVENTS.devconBangkok.lng) },
  { title: 'QSNCC Genesis', rarity: 3, sol: 1.0, lat: EVENTS.devconBangkok.lat, lng: EVENTS.devconBangkok.lng },

  // KBW (Seoul)
  { title: 'Gangnam Glitch', rarity: 0, sol: 0.006, lat: generateRandomOffset(EVENTS.koreaBlockchainWeek.lat), lng: generateRandomOffset(EVENTS.koreaBlockchainWeek.lng) },
  { title: 'COEX Protocol', rarity: 1, sol: 0.09, lat: generateRandomOffset(EVENTS.koreaBlockchainWeek.lat), lng: generateRandomOffset(EVENTS.koreaBlockchainWeek.lng) },

  // EthCC (Paris)
  { title: 'Seine Cipher', rarity: 0, sol: 0.007, lat: generateRandomOffset(EVENTS.ethCCParis.lat), lng: generateRandomOffset(EVENTS.ethCCParis.lng) },
  { title: 'Louvre Fragment', rarity: 2, sol: 0.40, lat: generateRandomOffset(EVENTS.ethCCParis.lat), lng: generateRandomOffset(EVENTS.ethCCParis.lng) },

  // Miami Crypto
  { title: 'Vice City Cache', rarity: 0, sol: 0.002, lat: generateRandomOffset(EVENTS.miamiCrypto.lat), lng: generateRandomOffset(EVENTS.miamiCrypto.lng) },
  { title: 'Magic City Vault', rarity: 1, sol: 0.06, lat: generateRandomOffset(EVENTS.miamiCrypto.lat), lng: generateRandomOffset(EVENTS.miamiCrypto.lng) },

  // Shoreditch Hacker House (London)
  { title: 'Silicon Roundabout', rarity: 0, sol: 0.009, lat: generateRandomOffset(EVENTS.hackerHouseLondon.lat), lng: generateRandomOffset(EVENTS.hackerHouseLondon.lng) },
  { title: 'Brick Lane Key', rarity: 2, sol: 0.20, lat: generateRandomOffset(EVENTS.hackerHouseLondon.lat), lng: generateRandomOffset(EVENTS.hackerHouseLondon.lng) },

  // NYC Hacker House
  { title: 'Subway Token', rarity: 0, sol: 0.005, lat: generateRandomOffset(EVENTS.hackerHouseNY.lat), lng: generateRandomOffset(EVENTS.hackerHouseNY.lng) },
  { title: 'Gotham Beacon', rarity: 1, sol: 0.1, lat: generateRandomOffset(EVENTS.hackerHouseNY.lat), lng: generateRandomOffset(EVENTS.hackerHouseNY.lng) },
];

// ── Geohash helper ───────────────────────────────────────────────────────────
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

function encodeGeohash(lat: number, lng: number, precision = 7): string {
  let idx = 0, bit = 0;
  let evenBit = true;
  let geohash = '';
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) { idx = idx * 2 + 1; lngMin = mid; }
      else { idx = idx * 2; lngMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { idx = idx * 2 + 1; latMin = mid; }
      else { idx = idx * 2; latMax = mid; }
    }
    evenBit = !evenBit;
    if (++bit === 5) { geohash += BASE32[idx]; bit = 0; idx = 0; }
  }
  return geohash;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  console.log(`Seeding ${DEMO_DROPS.length} realistic drops…`);

  for (const drop of DEMO_DROPS) {
    const geohash = encodeGeohash(drop.lat, drop.lng, 7);
    const lamports = Math.round(drop.sol * 1e9);

    const { error } = await supabase.from('drops').insert({
      on_chain_address: `SEED_${Math.random().toString(36).slice(2)}`,
      creator_wallet: 'SeedScript11111111111111111111111111111111',
      title: drop.title,
      description: `A ${['Common', 'Rare', 'Epic', 'Legendary'][drop.rarity]} loot drop seeded for demo purposes near a major crypto event.`,
      location: `POINT(${drop.lng} ${drop.lat})`,
      geohash,
      rarity_tier: drop.rarity,
      asset_type: 0,
      asset_amount: lamports,
      max_claims: drop.rarity === 3 ? 1 : 10,
      expires_at: expiresAt,
    });

    if (error) {
      console.error(`Failed to seed "${drop.title}":`, error.message);
    } else {
      console.log(`✓ Seeded: ${drop.title} (${['Common', 'Rare', 'Epic', 'Legendary'][drop.rarity]}, ${drop.sol} SOL)`);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
