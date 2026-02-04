/**
 * Solana Agent Kit - Integration Index
 * All DeFi protocol integrations in one place
 */

export * from './marinade.js';
export * from './raydium.js';
export * from './kamino.js';
export * from './metaplex.js';

// Re-export default objects
import marinade from './marinade.js';
import raydium from './raydium.js';
import kamino from './kamino.js';
import metaplex from './metaplex.js';

export const integrations = {
  marinade,
  raydium,
  kamino,
  metaplex,
};

export default integrations;
