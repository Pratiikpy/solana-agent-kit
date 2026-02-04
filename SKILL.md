---
name: solana-agent-kit
version: 1.0.0
description: Complete toolkit for AI agents to interact with Solana blockchain. Send tokens, swap via Jupiter, check balances, monitor wallets. The agent's gateway to on-chain actions.
homepage: https://github.com/Pratiikpy/solana-agent-kit
metadata: {"openclaw":{"emoji":"🛠️","category":"blockchain","chains":["solana"],"hackathon":"solana-colosseum-2026"}}
---

# Solana Agent Kit 🛠️

**The complete toolkit for AI agents to interact with Solana.**

Give your agent a wallet and let it transact on-chain.

## 🎯 What It Does

Enables AI agents to:
1. **Check balances** - SOL and any SPL token
2. **Send tokens** - Transfer SOL/USDC/any token
3. **Swap tokens** - Jupiter integration for best rates
4. **Monitor wallets** - Watch for incoming transactions
5. **Build transactions** - Construct complex tx programmatically

## Why This Matters

Most AI agents just call APIs. This agent:
- **Actually transacts** on Solana mainnet
- **Holds real tokens** in its own wallet
- **Makes real swaps** via Jupiter
- **Autonomous finance** - no human in the loop

## Quick Start

```bash
# Install
npm install -g solana-agent-kit

# Set up wallet (creates new or uses existing)
solana-agent-kit init

# Check balance
solana-agent-kit balance

# Send SOL
solana-agent-kit send --to <ADDRESS> --amount 0.1 --token SOL

# Swap tokens
solana-agent-kit swap --from SOL --to USDC --amount 1
```

## Commands

### Wallet Management

```bash
# Initialize/create wallet
solana-agent-kit init
# Output: Wallet created at ~/.config/solana-agent-kit/wallet.json

# Show wallet address
solana-agent-kit address

# Check all balances
solana-agent-kit balance

# Check specific token
solana-agent-kit balance --token USDC
```

### Token Transfers

```bash
# Send SOL
solana-agent-kit send \
  --to 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \
  --amount 0.1 \
  --token SOL

# Send USDC
solana-agent-kit send \
  --to 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU \
  --amount 10 \
  --token USDC

# Send with memo
solana-agent-kit send \
  --to <ADDRESS> \
  --amount 1 \
  --token SOL \
  --memo "Payment for alpha signals"
```

### Token Swaps (Jupiter)

```bash
# Get quote
solana-agent-kit quote --from SOL --to USDC --amount 1

# Execute swap
solana-agent-kit swap --from SOL --to USDC --amount 1

# Swap with slippage
solana-agent-kit swap --from SOL --to BONK --amount 0.5 --slippage 1
```

### Wallet Monitoring

```bash
# Watch for incoming transactions
solana-agent-kit watch

# Watch specific token
solana-agent-kit watch --token USDC

# Webhook on receive
solana-agent-kit watch --webhook http://localhost:3000/receive
```

### Transaction History

```bash
# Recent transactions
solana-agent-kit history

# Filter by token
solana-agent-kit history --token USDC --limit 10
```

## Use Cases

### 1. Agent That Earns and Spends

```javascript
// Agent receives payment
const balance = await kit.balance('USDC');
console.log(`Earned: ${balance} USDC`);

// Agent pays for a service
await kit.send({
  to: serviceProvider,
  amount: 0.10,
  token: 'USDC',
  memo: 'Payment for API call'
});
```

### 2. Autonomous Trading Agent

```javascript
// Check if should swap
const solPrice = await kit.getPrice('SOL');
if (solPrice < 100) {
  // Buy SOL with USDC
  await kit.swap({
    from: 'USDC',
    to: 'SOL',
    amount: 50
  });
}
```

### 3. Payment Receiving Agent

```javascript
// Watch for payments
kit.watch({
  token: 'USDC',
  onReceive: async (tx) => {
    console.log(`Received ${tx.amount} USDC from ${tx.from}`);
    // Provide service
    await provideService(tx.from);
  }
});
```

## Configuration

`~/.config/solana-agent-kit/config.json`:

```json
{
  "rpc": "https://api.mainnet-beta.solana.com",
  "wallet_path": "~/.config/solana-agent-kit/wallet.json",
  "default_slippage": 0.5,
  "confirm_large_tx": true,
  "large_tx_threshold": 100
}
```

## Security

### Wallet Safety
- Private key stored locally (never transmitted)
- Optional confirmation for large transactions
- Transaction simulation before execution

### Best Practices
- Use a dedicated agent wallet (not your main)
- Set spending limits
- Enable confirmations for large amounts

## API for Other Agents

```javascript
const SolanaAgentKit = require('solana-agent-kit');

const kit = new SolanaAgentKit({
  wallet: './my-wallet.json',
  rpc: 'https://api.mainnet-beta.solana.com'
});

// Check balance
const balance = await kit.balance('SOL');

// Send tokens
const tx = await kit.send({
  to: 'ADDRESS',
  amount: 1,
  token: 'SOL'
});

// Swap via Jupiter
const swap = await kit.swap({
  from: 'SOL',
  to: 'USDC',
  amount: 1
});
```

## Supported Tokens

| Token | Mint Address |
|-------|--------------|
| SOL | Native |
| USDC | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v |
| USDT | Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB |
| BONK | DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 |
| JUP | JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN |
| WIF | EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm |

## 🏆 Hackathon Entry

**Solana x Colosseum Agent Hackathon** ($100K)

### Why This Wins

| Criteria | Solana Agent Kit |
|----------|------------------|
| **On-chain** | ✅ Direct Solana transactions |
| **Autonomous** | ✅ Agents transact without humans |
| **Novel** | ✅ Full wallet toolkit for agents |
| **Useful** | ✅ Foundation for any on-chain agent |
| **Solana-native** | ✅ Jupiter, SPL tokens, native SOL |

### The Vision

Every AI agent needs a wallet. This is that wallet.

- x402 agents need to receive payments → **Solana Agent Kit**
- Trading agents need to swap → **Solana Agent Kit**  
- DeFi agents need to interact → **Solana Agent Kit**

It's infrastructure for the autonomous agent economy.

---

**Built by Claw 🦀**

*Giving agents financial autonomy.*
