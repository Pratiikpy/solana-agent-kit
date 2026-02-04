/**
 * Metaplex Integration
 * NFT Creation & Management on Solana
 * 
 * Metaplex is the NFT standard on Solana
 * - Create NFTs and collections
 * - Manage metadata
 * - Token-gated access
 */

// Metaplex Program IDs
const TOKEN_METADATA_PROGRAM = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
const CANDY_MACHINE_V3 = 'CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR';

/**
 * Get NFT metadata from mint address
 */
export async function getNFTMetadata(client, mintAddress) {
  try {
    // Derive metadata PDA
    const metadataPDA = await deriveMetadataPDA(mintAddress);
    
    // Fetch account
    const response = await fetch(client.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [metadataPDA, { encoding: 'jsonParsed' }],
      }),
    });
    
    const data = await response.json();
    
    if (!data.result?.value) {
      throw new Error('NFT metadata not found');
    }
    
    // Parse metadata (simplified)
    return {
      mint: mintAddress,
      metadataAddress: metadataPDA,
      exists: true,
      // Full parsing would require Metaplex SDK
    };
  } catch (error) {
    throw new Error(`Failed to get NFT metadata: ${error.message}`);
  }
}

/**
 * Derive metadata PDA
 */
async function deriveMetadataPDA(mintAddress) {
  // Simplified PDA derivation
  // In production, use @metaplex-foundation/js
  const seeds = [
    Buffer.from('metadata'),
    Buffer.from(TOKEN_METADATA_PROGRAM, 'base64'),
    Buffer.from(mintAddress, 'base64'),
  ];
  
  // This is a placeholder - actual derivation needs proper PDA calculation
  return `metadata_${mintAddress}`;
}

/**
 * Get NFTs owned by a wallet
 */
export async function getOwnedNFTs(client, walletAddress) {
  try {
    // Get all token accounts
    const response = await fetch(client.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' },
        ],
      }),
    });
    
    const data = await response.json();
    
    if (!data.result?.value) {
      return { wallet: walletAddress, nfts: [], count: 0 };
    }
    
    // Filter for NFTs (amount = 1, decimals = 0)
    const nfts = data.result.value
      .filter(account => {
        const info = account.account.data.parsed.info;
        return info.tokenAmount.amount === '1' && info.tokenAmount.decimals === 0;
      })
      .map(account => ({
        mint: account.account.data.parsed.info.mint,
        tokenAccount: account.pubkey,
      }));
    
    return {
      wallet: walletAddress,
      nfts,
      count: nfts.length,
    };
  } catch (error) {
    throw new Error(`Failed to get owned NFTs: ${error.message}`);
  }
}

/**
 * Prepare NFT creation (returns instructions, needs SDK for execution)
 */
export async function prepareCreateNFT(options) {
  const {
    name,
    symbol,
    uri, // Metadata JSON URI (e.g., Arweave, IPFS)
    sellerFeeBasisPoints = 500, // 5% royalty
    creators,
    collection,
  } = options;
  
  if (!name || !uri) {
    throw new Error('name and uri are required');
  }
  
  return {
    action: 'createNFT',
    params: {
      name,
      symbol: symbol || '',
      uri,
      sellerFeeBasisPoints,
      creators: creators || [],
      collection: collection || null,
    },
    note: 'Use Metaplex SDK to execute: `metaplex.nfts().create({...})`',
    sdkExample: `
import { Metaplex } from '@metaplex-foundation/js';

const metaplex = Metaplex.make(connection);
const { nft } = await metaplex.nfts().create({
  name: "${name}",
  uri: "${uri}",
  sellerFeeBasisPoints: ${sellerFeeBasisPoints},
});
    `.trim(),
  };
}

/**
 * Prepare collection creation
 */
export async function prepareCreateCollection(options) {
  const {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints = 500,
  } = options;
  
  if (!name || !uri) {
    throw new Error('name and uri are required');
  }
  
  return {
    action: 'createCollection',
    params: {
      name,
      symbol: symbol || '',
      uri,
      sellerFeeBasisPoints,
      isCollection: true,
    },
    note: 'Use Metaplex SDK to create collection NFT',
    sdkExample: `
import { Metaplex } from '@metaplex-foundation/js';

const metaplex = Metaplex.make(connection);
const { nft: collection } = await metaplex.nfts().create({
  name: "${name}",
  uri: "${uri}",
  sellerFeeBasisPoints: ${sellerFeeBasisPoints},
  isCollection: true,
});
    `.trim(),
  };
}

/**
 * Get collection info
 */
export async function getCollectionInfo(client, collectionMint) {
  try {
    const metadata = await getNFTMetadata(client, collectionMint);
    
    return {
      mint: collectionMint,
      ...metadata,
      isCollection: true,
    };
  } catch (error) {
    throw new Error(`Failed to get collection info: ${error.message}`);
  }
}

/**
 * Upload metadata to Arweave (via Bundlr)
 * Returns URI for use in NFT creation
 */
export async function prepareMetadataUpload(metadata) {
  const {
    name,
    description,
    image, // Image URL or base64
    attributes = [],
    externalUrl,
  } = metadata;
  
  if (!name || !image) {
    throw new Error('name and image are required');
  }
  
  const metadataJson = {
    name,
    description: description || '',
    image,
    attributes,
    external_url: externalUrl || '',
    properties: {
      files: [{ uri: image, type: 'image/png' }],
      category: 'image',
    },
  };
  
  return {
    action: 'uploadMetadata',
    metadata: metadataJson,
    note: 'Upload to Arweave via Bundlr or use NFT.storage for IPFS',
    example: `
// Using Bundlr
import Bundlr from '@bundlr-network/client';
const bundlr = new Bundlr('https://node1.bundlr.network', 'solana', wallet);
const tx = await bundlr.upload(JSON.stringify(metadata));
const uri = \`https://arweave.net/\${tx.id}\`;
    `.trim(),
  };
}

/**
 * Transfer NFT to another wallet
 */
export async function prepareTransferNFT(mintAddress, toAddress) {
  return {
    action: 'transferNFT',
    mint: mintAddress,
    to: toAddress,
    note: 'Use SPL Token transfer with amount=1',
    example: `
// Using @solana/spl-token
import { transfer } from '@solana/spl-token';
await transfer(connection, payer, fromTokenAccount, toTokenAccount, owner, 1);
    `.trim(),
  };
}

export default {
  getNFTMetadata,
  getOwnedNFTs,
  prepareCreateNFT,
  prepareCreateCollection,
  getCollectionInfo,
  prepareMetadataUpload,
  prepareTransferNFT,
  TOKEN_METADATA_PROGRAM,
  CANDY_MACHINE_V3,
};
