/**
 * Kamino Finance Integration
 * Lending & Borrowing on Solana
 * 
 * Kamino is a leading lending protocol on Solana
 * - Deposit assets to earn yield
 * - Borrow against collateral
 * - Automated leverage strategies
 */

// Kamino Program ID
const KAMINO_LENDING_PROGRAM = 'KLend2g3cP87ber41rSMPVTHZ7KxRZ8s8RG9gR6kxvp';

// Kamino API
const KAMINO_API = 'https://api.kamino.finance';

/**
 * Get all lending markets
 */
export async function getMarkets() {
  try {
    const response = await fetch(`${KAMINO_API}/v2/markets`);
    const data = await response.json();
    
    return data.map(market => ({
      address: market.address,
      name: market.name,
      totalSupply: market.totalSupplyUsd,
      totalBorrow: market.totalBorrowUsd,
      reserves: market.reserves?.map(r => ({
        mint: r.mint,
        symbol: r.symbol,
        supplyApy: r.supplyInterestAPY,
        borrowApy: r.borrowInterestAPY,
        totalSupply: r.totalSupplyUsd,
        totalBorrow: r.totalBorrowUsd,
        ltv: r.loanToValue,
      })),
    }));
  } catch (error) {
    // Return hardcoded main market info if API fails
    return [{
      name: 'Main Market',
      protocol: 'Kamino',
      description: 'Deposit to earn, borrow against collateral',
    }];
  }
}

/**
 * Get reserve info for a specific asset
 */
export async function getReserveInfo(mintAddress) {
  try {
    const markets = await getMarkets();
    
    for (const market of markets) {
      const reserve = market.reserves?.find(r => r.mint === mintAddress);
      if (reserve) {
        return {
          market: market.name,
          ...reserve,
        };
      }
    }
    
    throw new Error('Reserve not found');
  } catch (error) {
    throw new Error(`Failed to get reserve info: ${error.message}`);
  }
}

/**
 * Get user position in Kamino
 */
export async function getUserPosition(walletAddress) {
  try {
    const response = await fetch(`${KAMINO_API}/v2/users/${walletAddress}/obligations`);
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return {
        wallet: walletAddress,
        hasPosition: false,
        deposits: [],
        borrows: [],
        healthFactor: null,
      };
    }
    
    // Parse obligations
    const positions = data.map(ob => ({
      market: ob.market,
      deposits: ob.deposits?.map(d => ({
        mint: d.mint,
        symbol: d.symbol,
        amount: d.amount,
        valueUsd: d.valueUsd,
      })),
      borrows: ob.borrows?.map(b => ({
        mint: b.mint,
        symbol: b.symbol,
        amount: b.amount,
        valueUsd: b.valueUsd,
      })),
      healthFactor: ob.healthFactor,
      ltv: ob.ltv,
      liquidationThreshold: ob.liquidationThreshold,
    }));
    
    return {
      wallet: walletAddress,
      hasPosition: true,
      positions,
    };
  } catch (error) {
    return {
      wallet: walletAddress,
      hasPosition: false,
      error: error.message,
    };
  }
}

/**
 * Get best lending rates
 */
export async function getBestRates() {
  try {
    const markets = await getMarkets();
    const allReserves = [];
    
    for (const market of markets) {
      if (market.reserves) {
        for (const reserve of market.reserves) {
          allReserves.push({
            market: market.name,
            ...reserve,
          });
        }
      }
    }
    
    // Sort by supply APY
    const bySupplyApy = [...allReserves]
      .filter(r => r.supplyApy > 0)
      .sort((a, b) => b.supplyApy - a.supplyApy)
      .slice(0, 10);
    
    // Sort by borrow APY (lowest first for borrowing)
    const byBorrowApy = [...allReserves]
      .filter(r => r.borrowApy > 0)
      .sort((a, b) => a.borrowApy - b.borrowApy)
      .slice(0, 10);
    
    return {
      bestSupplyRates: bySupplyApy,
      lowestBorrowRates: byBorrowApy,
    };
  } catch (error) {
    throw new Error(`Failed to get rates: ${error.message}`);
  }
}

/**
 * Calculate borrow power
 */
export async function calculateBorrowPower(walletAddress) {
  try {
    const position = await getUserPosition(walletAddress);
    
    if (!position.hasPosition || !position.positions?.length) {
      return {
        wallet: walletAddress,
        totalDeposits: 0,
        totalBorrows: 0,
        availableToBorrow: 0,
        healthFactor: null,
      };
    }
    
    let totalDeposits = 0;
    let totalBorrows = 0;
    let weightedLtv = 0;
    
    for (const pos of position.positions) {
      const depositValue = pos.deposits?.reduce((sum, d) => sum + (d.valueUsd || 0), 0) || 0;
      const borrowValue = pos.borrows?.reduce((sum, b) => sum + (b.valueUsd || 0), 0) || 0;
      
      totalDeposits += depositValue;
      totalBorrows += borrowValue;
      
      if (pos.ltv && depositValue > 0) {
        weightedLtv += pos.ltv * depositValue;
      }
    }
    
    const avgLtv = totalDeposits > 0 ? weightedLtv / totalDeposits : 0;
    const maxBorrow = totalDeposits * avgLtv;
    const availableToBorrow = Math.max(0, maxBorrow - totalBorrows);
    
    return {
      wallet: walletAddress,
      totalDeposits,
      totalBorrows,
      maxBorrow,
      availableToBorrow,
      utilizationRate: maxBorrow > 0 ? (totalBorrows / maxBorrow) * 100 : 0,
    };
  } catch (error) {
    throw new Error(`Failed to calculate borrow power: ${error.message}`);
  }
}

/**
 * Get deposit instructions (returns info, actual tx needs SDK)
 */
export async function prepareDeposit(mintAddress, amount) {
  try {
    const reserveInfo = await getReserveInfo(mintAddress);
    
    return {
      action: 'deposit',
      mint: mintAddress,
      amount,
      reserve: reserveInfo,
      expectedApy: reserveInfo.supplyApy,
      note: 'Use Kamino SDK or UI to execute deposit transaction',
    };
  } catch (error) {
    throw new Error(`Failed to prepare deposit: ${error.message}`);
  }
}

/**
 * Get borrow instructions (returns info, actual tx needs SDK)
 */
export async function prepareBorrow(mintAddress, amount) {
  try {
    const reserveInfo = await getReserveInfo(mintAddress);
    
    return {
      action: 'borrow',
      mint: mintAddress,
      amount,
      reserve: reserveInfo,
      borrowApy: reserveInfo.borrowApy,
      note: 'Use Kamino SDK or UI to execute borrow transaction',
    };
  } catch (error) {
    throw new Error(`Failed to prepare borrow: ${error.message}`);
  }
}

export default {
  getMarkets,
  getReserveInfo,
  getUserPosition,
  getBestRates,
  calculateBorrowPower,
  prepareDeposit,
  prepareBorrow,
  KAMINO_LENDING_PROGRAM,
};
