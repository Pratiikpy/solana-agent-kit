/**
 * Solana Client Module
 * Structured for @solana/kit integration
 * Following Solana Foundation framework-kit patterns
 * 
 * In production, would use:
 * - createSolanaRpc from @solana/kit
 * - Proper RPC types and codecs
 */

import { loadConfig, loadWallet } from './wallet.js';

// Note: In full implementation, import from @solana/kit
// import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

// Token mint addresses (as Address type strings)
export const TOKENS = {
  SOL: {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    decimals: 9,
    name: 'Solana'
  },
  USDC: {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin'
  },
  USDT: {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether'
  },
  BONK: {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    decimals: 5,
    name: 'Bonk'
  },
  JUP: {
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    decimals: 6,
    name: 'Jupiter'
  },
  WIF: {
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    symbol: 'WIF',
    decimals: 6,
    name: 'dogwifhat'
  },
  PYTH: {
    mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    symbol: 'PYTH',
    decimals: 6,
    name: 'Pyth Network'
  }
};

const LAMPORTS_PER_SOL = 1_000_000_000n;

/**
 * Create RPC client following @solana/kit patterns
 * In full implementation, would use createSolanaRpc from @solana/kit
 */
export function createClient(options = {}) {
  const config = loadConfig();
  const rpcUrl = options.rpc || config.rpc || 'https://api.mainnet-beta.solana.com';
  const commitment = options.commitment || config.commitment || 'confirmed';
  
  return {
    rpcUrl,
    commitment,
    
    /**
     * Make RPC call - following Kit patterns but using fetch for portability
     */
    async call(method, params = []) {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        })
      });
      
      const json = await response.json();
      if (json.error) {
        throw new Error(json.error.message);
      }
      return json.result;
    },
    
    /**
     * Get SOL balance for address
     * Returns balance in SOL (not lamports)
     */
    async getBalance(address) {
      const result = await this.call('getBalance', [address, { commitment }]);
      return Number(result.value) / Number(LAMPORTS_PER_SOL);
    },
    
    /**
     * Get token account balance
     */
    async getTokenBalance(address, mint) {
      try {
        const result = await this.call('getTokenAccountsByOwner', [
          address,
          { mint },
          { encoding: 'jsonParsed', commitment }
        ]);
        
        if (result.value && result.value.length > 0) {
          const info = result.value[0].account.data.parsed.info;
          return parseFloat(info.tokenAmount.uiAmount || 0);
        }
        return 0;
      } catch (e) {
        return 0;
      }
    },
    
    /**
     * Get recent blockhash
     */
    async getRecentBlockhash() {
      const result = await this.call('getLatestBlockhash', [{ commitment }]);
      return result.value.blockhash;
    },
    
    /**
     * Get slot
     */
    async getSlot() {
      return await this.call('getSlot', [{ commitment }]);
    },
    
    /**
     * Get account info
     */
    async getAccountInfo(address) {
      const result = await this.call('getAccountInfo', [
        address,
        { encoding: 'jsonParsed', commitment }
      ]);
      return result.value;
    },
    
    /**
     * Get transaction history
     */
    async getSignaturesForAddress(address, limit = 10) {
      return await this.call('getSignaturesForAddress', [
        address,
        { limit, commitment }
      ]);
    }
  };
}

/**
 * Get Jupiter quote for swap
 */
export async function getJupiterQuote(inputMint, outputMint, amount, decimals) {
  const amountLamports = Math.floor(amount * Math.pow(10, decimals));
  const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=50`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Jupiter API error: ${response.status}`);
  }
  return await response.json();
}

/**
 * Get token price from Jupiter
 */
export async function getTokenPrice(tokenSymbol) {
  const token = TOKENS[tokenSymbol.toUpperCase()];
  if (!token) return null;
  
  try {
    const url = `https://api.jup.ag/price/v2?ids=${token.mint}`;
    const response = await fetch(url);
    const json = await response.json();
    return json.data?.[token.mint]?.price || null;
  } catch (e) {
    return null;
  }
}

/**
 * Get all balances for an address
 */
export async function getAllBalances(address) {
  const client = createClient();
  const balances = [];
  
  // SOL balance
  const solBalance = await client.getBalance(address);
  const solPrice = await getTokenPrice('SOL');
  balances.push({
    token: 'SOL',
    balance: solBalance,
    price: solPrice,
    value: solPrice ? solBalance * solPrice : null
  });
  
  // Token balances
  for (const [symbol, info] of Object.entries(TOKENS)) {
    if (symbol === 'SOL') continue;
    
    try {
      const balance = await client.getTokenBalance(address, info.mint);
      if (balance > 0) {
        const price = await getTokenPrice(symbol);
        balances.push({
          token: symbol,
          balance,
          price,
          value: price ? balance * price : null
        });
      }
    } catch (e) {
      // Skip on error
    }
  }
  
  return balances;
}
