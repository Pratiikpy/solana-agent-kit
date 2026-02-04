/**
 * Wallet Management Module
 * Proper Solana keypair generation using @solana/web3.js
 */

import fs from 'fs';
import path from 'path';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';

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
 * Generate a new Solana keypair
 */
export async function createWallet() {
  ensureConfigDir();
  
  if (fs.existsSync(WALLET_PATH)) {
    throw new Error('Wallet already exists. Delete ~/.config/solana-agent-kit/wallet.json to create new one.');
  }
  
  // Generate mnemonic
  const mnemonic = bip39.generateMnemonic();
  
  // Generate keypair from random bytes
  const keypair = Keypair.generate();
  
  const walletData = {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: Array.from(keypair.secretKey),
    mnemonic: mnemonic, // For backup purposes
    createdAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(WALLET_PATH, JSON.stringify(walletData, null, 2), { mode: 0o600 });
  
  return {
    publicKey: walletData.publicKey,
    mnemonic: mnemonic,
  };
}

/**
 * Load existing wallet
 */
export function loadWallet() {
  if (!fs.existsSync(WALLET_PATH)) {
    return null;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(data.secretKey));
    
    return {
      publicKey: keypair.publicKey.toBase58(),
      keypair: keypair,
    };
  } catch (e) {
    console.error('Error loading wallet:', e.message);
    return null;
  }
}

/**
 * Get wallet address
 */
export function getAddress() {
  const wallet = loadWallet();
  return wallet ? wallet.publicKey : null;
}

/**
 * Delete wallet (with confirmation)
 */
export function deleteWallet() {
  if (fs.existsSync(WALLET_PATH)) {
    fs.unlinkSync(WALLET_PATH);
    return true;
  }
  return false;
}

/**
 * Import wallet from secret key (base58 or array)
 */
export async function importWallet(secretKeyInput) {
  ensureConfigDir();
  
  if (fs.existsSync(WALLET_PATH)) {
    throw new Error('Wallet already exists. Delete it first.');
  }
  
  let keypair;
  
  if (Array.isArray(secretKeyInput)) {
    keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyInput));
  } else if (typeof secretKeyInput === 'string') {
    // Assume base58 encoded
    const bs58 = (await import('bs58')).default;
    const decoded = bs58.decode(secretKeyInput);
    keypair = Keypair.fromSecretKey(decoded);
  } else {
    throw new Error('Invalid secret key format');
  }
  
  const walletData = {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: Array.from(keypair.secretKey),
    importedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(WALLET_PATH, JSON.stringify(walletData, null, 2), { mode: 0o600 });
  
  return {
    publicKey: walletData.publicKey,
  };
}

/**
 * Load or create config
 */
export function loadConfig() {
  ensureConfigDir();
  
  const defaultConfig = {
    network: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    commitment: 'confirmed',
  };
  
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  
  try {
    return { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
  } catch (e) {
    return defaultConfig;
  }
}

/**
 * Save config
 */
export function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export default {
  createWallet,
  loadWallet,
  getAddress,
  deleteWallet,
  importWallet,
  loadConfig,
  saveConfig,
};
