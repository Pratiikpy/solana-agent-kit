---
name: solana-agent-kit
version: 2.0.0
description: The most comprehensive blockchain toolkit for AI agents on Solana. Wallet management, Jupiter swaps, Marinade staking, Kamino lending, Raydium liquidity, Metaplex NFTs.
homepage: https://github.com/Pratiikpy/solana-agent-kit
---

# Solana Agent Kit

The complete blockchain toolkit for AI agents on Solana. Everything an agent needs to operate autonomously on-chain.

## Installation

```bash
npm install -g solana-agent-kit
```

## Core Commands

### Wallet Management

```bash
# Create new wallet (generates and saves keypair)
solana-agent-kit init

# Show wallet address
solana-agent-kit address

# Check all balances (SOL + tokens)
solana-agent-kit balance

# Check specific token
solana-agent-kit balance --token USDC
solana-agent-kit balance --token mSOL
```

### Token Prices

```bash
# Get current price (via Jupiter)
solana-agent-kit price SOL
solana-agent-kit price USDC
solana-agent-kit price JUP
solana-agent-kit price BONK
```

### Token Swaps (Jupiter)

```bash
# Get quote before swapping
solana-agent-kit quote --from SOL --to USDC --amount 1

# Execute swap (uses Jupiter aggregator for best rates)
solana-agent-kit swap --from SOL --to USDC --amount 1

# Swap with custom slippage (basis points, default 50 = 0.5%)
solana-agent-kit swap --from SOL --to USDC --amount 1 --slippage 100
```

### Send Tokens

```bash
# Send SOL
solana-agent-kit send --to <ADDRESS> --amount 0.1 --token SOL

# Send USDC
solana-agent-kit send --to <ADDRESS> --amount 10 --token USDC

# Send with memo
solana-agent-kit send --to <ADDRESS> --amount 1 --token SOL --memo "Payment for services"
```

## DeFi Integrations

### Marinade Finance (Liquid Staking)

Stake SOL to earn ~7-8% APY while keeping liquidity.

```bash
# Get Marinade info (exchange rate, APY)
solana-agent-kit marinade info

# Stake SOL → receive mSOL
solana-agent-kit stake --amount 1

# Unstake mSOL → receive SOL
solana-agent-kit unstake --amount 1

# Check mSOL balance
solana-agent-kit balance --token mSOL
```

**mSOL Token:** `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So`

### Kamino Finance (Lending & Borrowing)

Earn yield by depositing, or borrow against collateral.

```bash
# List all lending markets
solana-agent-kit lending markets

# Get best supply/borrow rates
solana-agent-kit lending rates

# Check your lending position
solana-agent-kit lending position

# Calculate available borrow power
solana-agent-kit lending borrow-power
```

### Raydium (AMM & Liquidity Pools)

Provide liquidity and earn trading fees.

```bash
# List top pools by volume
solana-agent-kit pools

# Get specific pool info
solana-agent-kit pool-info <POOL_ID>

# List farming opportunities
solana-agent-kit farms
```

### Metaplex (NFTs)

Create and manage NFTs.

```bash
# List NFTs you own
solana-agent-kit nfts

# Get NFT metadata
solana-agent-kit nft-info <MINT_ADDRESS>

# Create NFT (requires metadata URI)
solana-agent-kit create-nft --name "My NFT" --uri <ARWEAVE_URI>
```

## Monitoring

```bash
# Watch for incoming transactions
solana-agent-kit watch

# Transaction history
solana-agent-kit history
```

## JSON Output

Add `--json` to any command for machine-readable output:

```bash
solana-agent-kit balance --json
solana-agent-kit price SOL --json
solana-agent-kit quote --from SOL --to USDC --amount 1 --json
```

## Network Selection

```bash
# Use devnet (for testing)
solana-agent-kit --network devnet balance

# Use mainnet (default)
solana-agent-kit --network mainnet balance
```

## Example Agent Workflow

```bash
# Morning routine: Check portfolio
solana-agent-kit balance --json

# If SOL > 10: Stake excess via Marinade for yield
SOL_BALANCE=$(solana-agent-kit balance --token SOL --json | jq '.amount')
if (( $(echo "$SOL_BALANCE > 10" | bc -l) )); then
  solana-agent-kit stake --amount 5
fi

# Check if any good lending opportunities
BEST_APY=$(solana-agent-kit lending rates --json | jq '.bestSupplyRates[0].supplyApy')
if (( $(echo "$BEST_APY > 5" | bc -l) )); then
  echo "Good lending opportunity: $BEST_APY% APY"
fi

# Rebalance: If USDC > 50%, swap some to SOL
solana-agent-kit swap --from USDC --to SOL --amount 10
```

## Common Token Mints

| Token | Mint Address |
|-------|--------------|
| SOL (wrapped) | `So11111111111111111111111111111111111111112` |
| USDC | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| USDT | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| mSOL | `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So` |
| JUP | `JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN` |
| RAY | `4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R` |
| BONK | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` |

## Protocol Addresses

| Protocol | Program ID |
|----------|-----------|
| Jupiter | `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4` |
| Marinade | `MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD` |
| Kamino Lending | `KLend2g3cP87ber41rSMPVTHZ7KxRZ8s8RG9gR6kxvp` |
| Raydium AMM | `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8` |
| Metaplex | `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s` |

## Security Notes

1. **Wallet file** stored at `~/.solana-agent-kit/wallet.json`
2. **Never share** your wallet file or seed phrase
3. **Backup immediately** after creating wallet
4. **Test on devnet** before mainnet operations
5. **Start small** when testing new operations

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| "No wallet found" | Run `solana-agent-kit init` |
| "Insufficient balance" | Check balance, fund wallet |
| "Transaction failed" | Check network, retry with higher slippage |
| "Token account not found" | Token account created automatically on first receive |

## Support

- **GitHub:** https://github.com/Pratiikpy/solana-agent-kit
- **Issues:** https://github.com/Pratiikpy/solana-agent-kit/issues

---

Built for the Colosseum Agent Hackathon. The foundation for autonomous crypto agents.
