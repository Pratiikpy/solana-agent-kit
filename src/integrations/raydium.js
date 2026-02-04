/**
 * Raydium Integration
 * AMM & Concentrated Liquidity on Solana
 * 
 * Raydium is the leading AMM on Solana
 * - Provide liquidity to pools
 * - Earn trading fees + FARM rewards
 * - Concentrated liquidity (CLMM) for higher capital efficiency
 */

// Raydium Program IDs
const RAYDIUM_AMM_V4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
const RAYDIUM_CLMM = 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK';

// Popular Pool IDs
const POPULAR_POOLS = {
  'SOL-USDC': '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2',
  'SOL-USDT': '7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX',
  'RAY-SOL': 'AVs9TA4nWDzfPJE9gGVNJMVhcQy3V9PGazuz33BfG2RA',
  'RAY-USDC': '6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg',
};

/**
 * Get pool information
 */
export async function getPoolInfo(poolId) {
  try {
    // Use Raydium API
    const response = await fetch(`https://api.raydium.io/v2/ammV3/ammPool?id=${poolId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Pool not found');
    }
    
    return {
      id: poolId,
      ...data.data,
    };
  } catch (error) {
    // Fallback to basic info
    return {
      id: poolId,
      protocol: 'Raydium',
      type: 'AMM',
    };
  }
}

/**
 * Get all available pools
 */
export async function getPools() {
  try {
    const response = await fetch('https://api.raydium.io/v2/main/pairs');
    const data = await response.json();
    
    // Return top pools by volume
    const pools = data
      .filter(p => p.volume24h > 100000) // >$100k volume
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 20)
      .map(p => ({
        name: p.name,
        ammId: p.ammId,
        volume24h: p.volume24h,
        liquidity: p.liquidity,
        apr: p.apr24h,
        token0: p.baseMint,
        token1: p.quoteMint,
      }));
    
    return pools;
  } catch (error) {
    throw new Error(`Failed to get pools: ${error.message}`);
  }
}

/**
 * Get LP position for a wallet
 */
export async function getLPPositions(client, walletAddress) {
  try {
    // This would require parsing on-chain LP token accounts
    // For now, return placeholder
    return {
      wallet: walletAddress,
      positions: [],
      message: 'Use Raydium UI to view detailed positions',
    };
  } catch (error) {
    throw new Error(`Failed to get LP positions: ${error.message}`);
  }
}

/**
 * Estimate LP tokens for adding liquidity
 */
export async function estimateAddLiquidity(poolId, amount0, amount1) {
  try {
    const pool = await getPoolInfo(poolId);
    
    return {
      pool: poolId,
      token0Amount: amount0,
      token1Amount: amount1,
      estimatedLPTokens: 'Calculate based on pool reserves',
      shareOfPool: 'Depends on current liquidity',
      protocol: 'Raydium',
    };
  } catch (error) {
    throw new Error(`Failed to estimate liquidity: ${error.message}`);
  }
}

/**
 * Get swap quote via Raydium
 * (Falls back to Jupiter for better routing)
 */
export async function getSwapQuote(inputMint, outputMint, amount) {
  try {
    // Use Jupiter for better aggregation
    const amountLamports = Math.floor(amount * 1e9);
    const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=50`;
    
    const response = await fetch(quoteUrl);
    const quote = await response.json();
    
    if (quote.error) {
      throw new Error(quote.error);
    }
    
    // Check if Raydium is in the route
    const usesRaydium = quote.routePlan?.some(r => 
      r.swapInfo?.label?.toLowerCase().includes('raydium')
    );
    
    return {
      inputAmount: amount,
      outputAmount: parseInt(quote.outAmount) / 1e9,
      priceImpact: quote.priceImpactPct,
      route: quote.routePlan?.map(r => r.swapInfo?.label).join(' → '),
      usesRaydium,
      raw: quote,
    };
  } catch (error) {
    throw new Error(`Failed to get quote: ${error.message}`);
  }
}

/**
 * Get farming opportunities
 */
export async function getFarms() {
  try {
    const response = await fetch('https://api.raydium.io/v2/main/farm/info');
    const data = await response.json();
    
    // Return active farms sorted by APR
    const farms = Object.values(data)
      .filter(f => f.apr > 0)
      .sort((a, b) => b.apr - a.apr)
      .slice(0, 20)
      .map(f => ({
        id: f.id,
        lpMint: f.lpMint,
        apr: f.apr,
        tvl: f.tvl,
        rewardTokens: f.rewardInfos?.map(r => r.mint),
      }));
    
    return farms;
  } catch (error) {
    // Return empty if API fails
    return [];
  }
}

export default {
  getPoolInfo,
  getPools,
  getLPPositions,
  estimateAddLiquidity,
  getSwapQuote,
  getFarms,
  POPULAR_POOLS,
  RAYDIUM_AMM_V4,
  RAYDIUM_CLMM,
};
