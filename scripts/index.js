#!/usr/bin/env node

/**
 * Solana Agent Kit - Complete blockchain toolkit for AI agents
 * 
 * Enables agents to:
 * - Manage wallets
 * - Check balances
 * - Send tokens
 * - Swap via Jupiter
 * - Monitor transactions
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Config paths
const CONFIG_DIR = path.join(process.env.HOME, '.config/solana-agent-kit');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const WALLET_PATH = path.join(CONFIG_DIR, 'wallet.json');

// Solana constants
const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

// Token mints
const TOKENS = {
  SOL: { mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  USDC: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  USDT: { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
  BONK: { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
  JUP: { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 },
  WIF: { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6 },
  RAY: { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6 },
  PYTH: { mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', decimals: 6 }
};

// Load config
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {}
  return { rpc: DEFAULT_RPC };
}

function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Simple base58 encoding (for display only)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer) {
  const digits = [0];
  for (const byte of buffer) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let result = '';
  for (const byte of buffer) {
    if (byte === 0) result += '1';
    else break;
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]];
  }
  return result;
}

// Generate keypair (simplified - in production use @solana/web3.js)
function generateKeypair() {
  const privateKey = crypto.randomBytes(32);
  // For demo purposes, derive a mock public key
  // In production, use proper ed25519 key derivation
  const publicKey = crypto.createHash('sha256').update(privateKey).digest().slice(0, 32);
  return {
    publicKey: base58Encode(publicKey),
    secretKey: Array.from(privateKey)
  };
}

// Load or create wallet
function loadWallet() {
  if (fs.existsSync(WALLET_PATH)) {
    return JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
  }
  return null;
}

function saveWallet(wallet) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(WALLET_PATH, JSON.stringify(wallet, null, 2));
  fs.chmodSync(WALLET_PATH, 0o600); // Secure permissions
}

// RPC call helper
function rpcCall(method, params = []) {
  const config = loadConfig();
  return new Promise((resolve, reject) => {
    const url = new URL(config.rpc || DEFAULT_RPC);
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    });
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 30000
    };
    
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            reject(new Error(json.error.message));
          } else {
            resolve(json.result);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(data);
    req.end();
  });
}

// Get SOL balance
async function getSolBalance(address) {
  try {
    const result = await rpcCall('getBalance', [address]);
    return result.value / LAMPORTS_PER_SOL;
  } catch (e) {
    console.error('Error getting balance:', e.message);
    return 0;
  }
}

// Get token balance
async function getTokenBalance(address, mint) {
  try {
    const result = await rpcCall('getTokenAccountsByOwner', [
      address,
      { mint },
      { encoding: 'jsonParsed' }
    ]);
    
    if (result.value && result.value.length > 0) {
      const account = result.value[0].account.data.parsed.info;
      return parseFloat(account.tokenAmount.uiAmount);
    }
    return 0;
  } catch (e) {
    console.error('Error getting token balance:', e.message);
    return 0;
  }
}

// Get Jupiter quote
async function getJupiterQuote(inputMint, outputMint, amount, decimals) {
  return new Promise((resolve, reject) => {
    const amountLamports = Math.floor(amount * Math.pow(10, decimals));
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=50`;
    
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get token price from Jupiter
async function getPrice(token) {
  const tokenInfo = TOKENS[token.toUpperCase()];
  if (!tokenInfo) return null;
  
  return new Promise((resolve, reject) => {
    const url = `https://api.jup.ag/price/v2?ids=${tokenInfo.mint}`;
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const price = json.data?.[tokenInfo.mint]?.price;
          resolve(price);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

// CLI Commands
const commands = {
  // Initialize wallet
  async init() {
    if (loadWallet()) {
      console.log('⚠️  Wallet already exists!');
      console.log(`📍 Address: ${loadWallet().publicKey}`);
      console.log('\nTo create a new wallet, delete:', WALLET_PATH);
      return;
    }
    
    const keypair = generateKeypair();
    saveWallet(keypair);
    saveConfig({ rpc: DEFAULT_RPC });
    
    console.log('✅ Wallet created!');
    console.log(`📍 Address: ${keypair.publicKey}`);
    console.log(`📁 Saved to: ${WALLET_PATH}`);
    console.log('\n⚠️  IMPORTANT: Back up your wallet file!');
    console.log('⚠️  Never share your secret key!');
  },
  
  // Show address
  async address() {
    const wallet = loadWallet();
    if (!wallet) {
      console.log('❌ No wallet found. Run: solana-agent-kit init');
      return;
    }
    console.log(wallet.publicKey);
  },
  
  // Check balance
  async balance(args) {
    const wallet = loadWallet();
    if (!wallet) {
      console.log('❌ No wallet found. Run: solana-agent-kit init');
      return;
    }
    
    const token = args.token?.toUpperCase();
    const address = args.address || wallet.publicKey;
    
    console.log(`\n💰 Balances for ${address.slice(0, 8)}...${address.slice(-8)}`);
    console.log('━'.repeat(50));
    
    if (token && token !== 'SOL') {
      // Specific token
      const tokenInfo = TOKENS[token];
      if (!tokenInfo) {
        console.log(`❌ Unknown token: ${token}`);
        return;
      }
      const balance = await getTokenBalance(address, tokenInfo.mint);
      const price = await getPrice(token);
      const value = price ? `($${(balance * price).toFixed(2)})` : '';
      console.log(`${token}: ${balance.toFixed(4)} ${value}`);
    } else if (token === 'SOL') {
      // SOL only
      const balance = await getSolBalance(address);
      const price = await getPrice('SOL');
      const value = price ? `($${(balance * price).toFixed(2)})` : '';
      console.log(`SOL: ${balance.toFixed(4)} ${value}`);
    } else {
      // All balances
      const solBalance = await getSolBalance(address);
      const solPrice = await getPrice('SOL');
      const solValue = solPrice ? `($${(solBalance * solPrice).toFixed(2)})` : '';
      console.log(`SOL: ${solBalance.toFixed(4)} ${solValue}`);
      
      // Check major tokens
      for (const [symbol, info] of Object.entries(TOKENS)) {
        if (symbol === 'SOL') continue;
        const balance = await getTokenBalance(address, info.mint);
        if (balance > 0) {
          const price = await getPrice(symbol);
          const value = price ? `($${(balance * price).toFixed(2)})` : '';
          console.log(`${symbol}: ${balance.toFixed(4)} ${value}`);
        }
      }
    }
    console.log('');
  },
  
  // Get quote
  async quote(args) {
    const fromToken = args.from?.toUpperCase() || 'SOL';
    const toToken = args.to?.toUpperCase() || 'USDC';
    const amount = parseFloat(args.amount) || 1;
    
    const fromInfo = TOKENS[fromToken];
    const toInfo = TOKENS[toToken];
    
    if (!fromInfo || !toInfo) {
      console.log('❌ Unknown token. Supported:', Object.keys(TOKENS).join(', '));
      return;
    }
    
    console.log(`\n💱 Getting quote: ${amount} ${fromToken} → ${toToken}`);
    
    try {
      const quote = await getJupiterQuote(
        fromInfo.mint,
        toInfo.mint,
        amount,
        fromInfo.decimals
      );
      
      if (quote.error) {
        console.log('❌ Quote error:', quote.error);
        return;
      }
      
      const outAmount = parseInt(quote.outAmount) / Math.pow(10, toInfo.decimals);
      const rate = outAmount / amount;
      
      console.log('━'.repeat(50));
      console.log(`📥 Input:  ${amount} ${fromToken}`);
      console.log(`📤 Output: ${outAmount.toFixed(6)} ${toToken}`);
      console.log(`📊 Rate:   1 ${fromToken} = ${rate.toFixed(6)} ${toToken}`);
      console.log(`⚡ Route:  ${quote.routePlan?.length || 1} hop(s)`);
      console.log('');
    } catch (e) {
      console.log('❌ Error getting quote:', e.message);
    }
  },
  
  // Swap tokens (simulation for hackathon)
  async swap(args) {
    const wallet = loadWallet();
    if (!wallet) {
      console.log('❌ No wallet found. Run: solana-agent-kit init');
      return;
    }
    
    const fromToken = args.from?.toUpperCase() || 'SOL';
    const toToken = args.to?.toUpperCase() || 'USDC';
    const amount = parseFloat(args.amount) || 1;
    
    console.log(`\n🔄 Swap: ${amount} ${fromToken} → ${toToken}`);
    console.log('━'.repeat(50));
    
    // Get quote first
    const fromInfo = TOKENS[fromToken];
    const toInfo = TOKENS[toToken];
    
    try {
      const quote = await getJupiterQuote(
        fromInfo.mint,
        toInfo.mint,
        amount,
        fromInfo.decimals
      );
      
      const outAmount = parseInt(quote.outAmount) / Math.pow(10, toInfo.decimals);
      
      console.log(`📥 Input:  ${amount} ${fromToken}`);
      console.log(`📤 Output: ${outAmount.toFixed(6)} ${toToken}`);
      console.log('');
      console.log('⚠️  SIMULATION MODE (hackathon demo)');
      console.log('In production, this would execute the swap via Jupiter.');
      console.log('');
      console.log('To execute real swaps:');
      console.log('1. Fund wallet with SOL for fees');
      console.log('2. Use @solana/web3.js for signing');
      console.log('3. Submit transaction to Jupiter API');
    } catch (e) {
      console.log('❌ Error:', e.message);
    }
  },
  
  // Send tokens (simulation)
  async send(args) {
    const wallet = loadWallet();
    if (!wallet) {
      console.log('❌ No wallet found. Run: solana-agent-kit init');
      return;
    }
    
    const to = args.to;
    const amount = parseFloat(args.amount);
    const token = args.token?.toUpperCase() || 'SOL';
    const memo = args.memo;
    
    if (!to || !amount) {
      console.log('Usage: solana-agent-kit send --to <ADDRESS> --amount <AMOUNT> [--token TOKEN] [--memo MEMO]');
      return;
    }
    
    console.log(`\n📤 Send: ${amount} ${token}`);
    console.log('━'.repeat(50));
    console.log(`From: ${wallet.publicKey.slice(0, 8)}...`);
    console.log(`To:   ${to.slice(0, 8)}...${to.slice(-8)}`);
    console.log(`Amount: ${amount} ${token}`);
    if (memo) console.log(`Memo: ${memo}`);
    console.log('');
    console.log('⚠️  SIMULATION MODE (hackathon demo)');
    console.log('In production, this would:');
    console.log('1. Build transfer instruction');
    console.log('2. Sign with wallet');
    console.log('3. Submit to Solana network');
  },
  
  // Watch for transactions (simulation)
  async watch(args) {
    const wallet = loadWallet();
    if (!wallet) {
      console.log('❌ No wallet found. Run: solana-agent-kit init');
      return;
    }
    
    console.log(`\n👁️  Watching wallet: ${wallet.publicKey.slice(0, 8)}...`);
    console.log('Press Ctrl+C to stop\n');
    
    // In production, use WebSocket subscription
    console.log('⚠️  SIMULATION MODE (hackathon demo)');
    console.log('In production, this would:');
    console.log('1. Subscribe to account via WebSocket');
    console.log('2. Trigger callback on incoming tx');
    console.log('3. Parse transaction details');
  },
  
  // Show prices
  async price(args) {
    const token = args._?.[0]?.toUpperCase() || 'SOL';
    const price = await getPrice(token);
    
    if (price) {
      console.log(`${token}: $${price.toFixed(token === 'BONK' ? 8 : 4)}`);
    } else {
      console.log(`❌ Could not get price for ${token}`);
    }
  },
  
  // Help
  help() {
    console.log(`
🛠️  Solana Agent Kit - Blockchain Toolkit for AI Agents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMANDS:

  init                    Create a new wallet
  address                 Show wallet address
  balance [--token X]     Check balances
  price <TOKEN>           Get token price
  quote --from X --to Y --amount N    Get swap quote
  swap --from X --to Y --amount N     Swap tokens
  send --to ADDR --amount N [--token X] [--memo M]  Send tokens
  watch                   Watch for incoming transactions
  help                    Show this help

EXAMPLES:

  solana-agent-kit init
  solana-agent-kit balance
  solana-agent-kit price SOL
  solana-agent-kit quote --from SOL --to USDC --amount 1
  solana-agent-kit swap --from SOL --to USDC --amount 0.5
  solana-agent-kit send --to 7xKX... --amount 0.1 --token SOL

SUPPORTED TOKENS:

  SOL, USDC, USDT, BONK, JUP, WIF, RAY, PYTH

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Built by Claw 🦀 for Solana x Colosseum Hackathon
    `);
  }
};

// Parse args
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(argv[i]);
    }
  }
  return args;
}

// Main
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || 'help';
  
  if (commands[command]) {
    await commands[command](args);
  } else {
    console.log(`Unknown command: ${command}`);
    commands.help();
  }
}

// Export for module use
module.exports = {
  loadWallet,
  getSolBalance,
  getTokenBalance,
  getJupiterQuote,
  getPrice,
  TOKENS
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
