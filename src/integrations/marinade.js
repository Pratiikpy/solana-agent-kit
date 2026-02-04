/**
 * Marinade Finance Integration
 * Liquid staking on Solana - stake SOL, get mSOL
 * 
 * Marinade is the largest liquid staking protocol on Solana
 * - Stake SOL → receive mSOL (liquid staking token)
 * - mSOL accrues staking rewards automatically
 * - Can unstake anytime (instant or delayed)
 */

import { address, createTransaction, appendTransactionMessageInstruction } from '@solana/kit';

// Marinade Program ID
const MARINADE_PROGRAM_ID = 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD';

// Marinade State Account
const MARINADE_STATE = '8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC';

// mSOL Mint
const MSOL_MINT = 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So';

/**
 * Get Marinade staking info
 */
export async function getMarinadeInfo(client) {
  try {
    // Get mSOL price from Jupiter
    const response = await fetch(
      `https://price.jup.ag/v6/price?ids=${MSOL_MINT}`
    );
    const data = await response.json();
    const msolPrice = data.data[MSOL_MINT]?.price || 0;
    
    // Get SOL price
    const solResponse = await fetch(
      'https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112'
    );
    const solData = await solResponse.json();
    const solPrice = solData.data['So11111111111111111111111111111111111111112']?.price || 0;
    
    // Calculate exchange rate (mSOL/SOL)
    const exchangeRate = solPrice > 0 ? msolPrice / solPrice : 1.0;
    
    return {
      protocol: 'Marinade Finance',
      msolMint: MSOL_MINT,
      msolPrice,
      solPrice,
      exchangeRate,
      apy: '~7-8%', // Approximate, varies
      description: 'Liquid staking - stake SOL, get mSOL',
    };
  } catch (error) {
    throw new Error(`Failed to get Marinade info: ${error.message}`);
  }
}

/**
 * Stake SOL to receive mSOL
 * Uses Jupiter to swap SOL → mSOL (simplest integration)
 */
export async function stakeSOL(client, wallet, amount) {
  try {
    // Use Jupiter swap SOL → mSOL
    const inputMint = 'So11111111111111111111111111111111111111112'; // SOL
    const outputMint = MSOL_MINT;
    const amountLamports = Math.floor(amount * 1e9);
    
    // Get quote
    const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=50`;
    const quoteResponse = await fetch(quoteUrl);
    const quote = await quoteResponse.json();
    
    if (quote.error) {
      throw new Error(quote.error);
    }
    
    // Get swap transaction
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: wallet.publicKey,
        wrapAndUnwrapSol: true,
      }),
    });
    
    const swapData = await swapResponse.json();
    
    return {
      quote: {
        inputAmount: amount,
        outputAmount: parseInt(quote.outAmount) / 1e9,
        exchangeRate: (parseInt(quote.outAmount) / 1e9) / amount,
        priceImpact: quote.priceImpactPct,
      },
      transaction: swapData.swapTransaction,
      message: `Staking ${amount} SOL → ~${(parseInt(quote.outAmount) / 1e9).toFixed(4)} mSOL`,
    };
  } catch (error) {
    throw new Error(`Failed to stake SOL: ${error.message}`);
  }
}

/**
 * Unstake mSOL to receive SOL
 * Uses Jupiter to swap mSOL → SOL
 */
export async function unstakeMSOL(client, wallet, amount) {
  try {
    const inputMint = MSOL_MINT;
    const outputMint = 'So11111111111111111111111111111111111111112'; // SOL
    const amountLamports = Math.floor(amount * 1e9);
    
    // Get quote
    const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=50`;
    const quoteResponse = await fetch(quoteUrl);
    const quote = await quoteResponse.json();
    
    if (quote.error) {
      throw new Error(quote.error);
    }
    
    // Get swap transaction
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: wallet.publicKey,
        wrapAndUnwrapSol: true,
      }),
    });
    
    const swapData = await swapResponse.json();
    
    return {
      quote: {
        inputAmount: amount,
        outputAmount: parseInt(quote.outAmount) / 1e9,
        exchangeRate: (parseInt(quote.outAmount) / 1e9) / amount,
        priceImpact: quote.priceImpactPct,
      },
      transaction: swapData.swapTransaction,
      message: `Unstaking ${amount} mSOL → ~${(parseInt(quote.outAmount) / 1e9).toFixed(4)} SOL`,
    };
  } catch (error) {
    throw new Error(`Failed to unstake mSOL: ${error.message}`);
  }
}

/**
 * Get mSOL balance
 */
export async function getMSOLBalance(client, walletAddress) {
  try {
    const response = await fetch(client.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { mint: MSOL_MINT },
          { encoding: 'jsonParsed' },
        ],
      }),
    });
    
    const data = await response.json();
    
    if (data.result?.value?.length > 0) {
      const balance = data.result.value[0].account.data.parsed.info.tokenAmount;
      return {
        amount: parseFloat(balance.uiAmountString),
        decimals: balance.decimals,
        mint: MSOL_MINT,
      };
    }
    
    return { amount: 0, decimals: 9, mint: MSOL_MINT };
  } catch (error) {
    throw new Error(`Failed to get mSOL balance: ${error.message}`);
  }
}

export default {
  getMarinadeInfo,
  stakeSOL,
  unstakeMSOL,
  getMSOLBalance,
  MSOL_MINT,
};
