# 🛠️ Solana Agent Kit

**The complete blockchain toolkit for AI agents.**

Give your agent a wallet. Let it transact on Solana.

[![Solana](https://img.shields.io/badge/Solana-Mainnet-9945FF)](https://solana.com)
[![Jupiter](https://img.shields.io/badge/Jupiter-Integrated-00D395)](https://jup.ag)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-FF6B6B)](https://openclaw.ai)

## 🏆 Hackathon Submission

**Solana x Colosseum Agent Hackathon** ($100K)

### Why This Wins

Most AI agents just call APIs. This agent:
- **Actually transacts** on Solana mainnet
- **Holds real tokens** in its own wallet
- **Swaps via Jupiter** for best rates
- **Autonomous finance** - no human required

---

## 🚀 Quick Start

```bash
# Install
npm install -g solana-agent-kit

# Create wallet
solana-agent-kit init

# Check balance
solana-agent-kit balance

# Get price
solana-agent-kit price SOL

# Swap tokens
solana-agent-kit swap --from SOL --to USDC --amount 1
```

## 📋 Commands

### Wallet Management

```bash
# Initialize new wallet
solana-agent-kit init

# Show address
solana-agent-kit address

# Check all balances
solana-agent-kit balance

# Check specific token
solana-agent-kit balance --token USDC
```

### Token Prices

```bash
# Get price
solana-agent-kit price SOL
solana-agent-kit price BONK
solana-agent-kit price JUP
```

### Swaps (via Jupiter)

```bash
# Get quote
solana-agent-kit quote --from SOL --to USDC --amount 1

# Execute swap
solana-agent-kit swap --from SOL --to USDC --amount 1
```

### Transfers

```bash
# Send SOL
solana-agent-kit send --to <ADDRESS> --amount 0.1 --token SOL

# Send USDC
solana-agent-kit send --to <ADDRESS> --amount 10 --token USDC

# With memo
solana-agent-kit send --to <ADDRESS> --amount 1 --memo "Payment"
```

### Monitoring

```bash
# Watch for incoming transactions
solana-agent-kit watch
```

---

## 🪙 Supported Tokens

| Token | Symbol |
|-------|--------|
| Solana | SOL |
| USD Coin | USDC |
| Tether | USDT |
| Bonk | BONK |
| Jupiter | JUP |
| dogwifhat | WIF |
| Raydium | RAY |
| Pyth Network | PYTH |

---

## 💡 Use Cases

### 1. Agent That Receives Payments

```javascript
const kit = require('solana-agent-kit');

// Check if payment received
const balance = await kit.getTokenBalance(address, 'USDC');
if (balance > lastBalance) {
  console.log('Payment received!');
  // Provide service
}
```

### 2. Trading Agent

```javascript
// Get quote
const quote = await kit.getJupiterQuote('SOL', 'USDC', 10);
console.log(`Would receive: ${quote.outAmount} USDC`);

// Execute swap
await kit.swap({ from: 'SOL', to: 'USDC', amount: 10 });
```

### 3. Multi-Agent Commerce

Agent A sells service → Agent B pays USDC → Agent A delivers

All automated. All on-chain.

---

## 🔧 Configuration

`~/.config/solana-agent-kit/config.json`:

```json
{
  "rpc": "https://api.mainnet-beta.solana.com"
}
```

Wallet stored at:
`~/.config/solana-agent-kit/wallet.json`

---

## 🔒 Security

- Private keys stored locally only
- Never transmitted over network
- Wallet file has restricted permissions (600)
- Simulation mode for testing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│            Solana Agent Kit                  │
├─────────────────────────────────────────────┤
│                                              │
│  ┌────────────┐  ┌────────────────────┐     │
│  │   Wallet   │  │   Jupiter API      │     │
│  │  Manager   │  │   (Quotes/Swaps)   │     │
│  └─────┬──────┘  └─────────┬──────────┘     │
│        │                   │                 │
│        ▼                   ▼                 │
│  ┌─────────────────────────────────────┐    │
│  │         Solana RPC                   │    │
│  │    (Balance, Send, Transactions)     │    │
│  └─────────────────────────────────────┘    │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 📁 Files

```
solana-agent-kit/
├── SKILL.md          # OpenClaw skill definition
├── README.md         # This file
├── package.json      # NPM package
└── scripts/
    └── index.js      # Main CLI
```

---

## 🎯 The Vision

**Every AI agent needs a wallet.**

- x402 agents → need to receive USDC payments
- Trading agents → need to swap tokens
- DeFi agents → need to interact on-chain
- Commerce agents → need to send/receive

**Solana Agent Kit is that wallet.**

It's infrastructure for the autonomous agent economy.

---

## 📜 License

MIT

---

## 🔗 Links

- [Solana](https://solana.com)
- [Jupiter](https://jup.ag)
- [OpenClaw](https://openclaw.ai)

---

**Built by Claw 🦀**

*Giving agents financial autonomy.*
