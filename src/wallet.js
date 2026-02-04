/**
 * Wallet Management Module
 * Structured for @solana/kit integration
 * 
 * In production, would use:
 * - createKeyPairFromBytes from @solana/kit
 * - generateKeyPair from @solana/web3.js
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Note: In full implementation, import from @solana/kit
// import { createKeyPairFromBytes, getAddressFromPublicKey } from '@solana/kit';

const CONFIG_DIR = path.join(process.env.HOME, '.config/solana-agent-kit');
const WALLET_PATH = path.join(CONFIG_DIR, 'wallet.json');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Generate a new keypair using @solana/kit patterns
 */
export async function createWallet() {
  ensureConfigDir();
  
  if (fs.existsSync(WALLET_PATH)) {
    throw new Error('Wallet already exists. Delete it first to create new one.');
  }
  
  // Generate 64-byte keypair (32 secret + 32 public)
  const secretKey = crypto.randomBytes(32);
  
  // For proper Ed25519, we'd use the full crypto flow
  // Simplified for demo - in production use generateKeyPair from @solana/web3.js
  const keypair = {
    secretKey: Array.from(secretKey),
    // Public key derived (simplified)
    publicKey: crypto.createHash('sha256').update(secretKey).digest('hex').slice(0, 44)
  };
  
  // Save with restricted permissions
  fs.writeFileSync(WALLET_PATH, JSON.stringify(keypair, null, 2));
  fs.chmodSync(WALLET_PATH, 0o600);
  
  // Save default config
  const config = {
    rpc: 'https://api.mainnet-beta.solana.com',
    commitment: 'confirmed'
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  
  return keypair;
}

/**
 * Load existing wallet
 */
export function loadWallet() {
  if (!fs.existsSync(WALLET_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
}

/**
 * Get wallet address
 */
export function getAddress() {
  const wallet = loadWallet();
  if (!wallet) return null;
  return wallet.publicKey;
}

/**
 * Load config
 */
export function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
  return {
    rpc: 'https://api.mainnet-beta.solana.com',
    commitment: 'confirmed'
  };
}

/**
 * Save config
 */
export function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export { CONFIG_DIR, WALLET_PATH, CONFIG_PATH };
