#!/usr/bin/env node

/**
 * Solana Agent Kit CLI
 * Built with @solana/kit following Solana Foundation guidelines
 * 
 * Usage:
 *   solana-agent-kit <command> [options]
 */

import { createWallet, loadWallet, getAddress, loadConfig } from './wallet.js';
import { createClient, TOKENS, getTokenPrice, getAllBalances, getJupiterQuote } from './client.js';
import { buildTransferTransaction, buildSwapTransaction, executeSwap, sendTransaction } from './transactions.js';

// Parse command line arguments
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
    } else if (argv[i].startsWith('-')) {
      const key = argv[i].slice(1);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
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

// Commands
const commands = {
  async init() {
    try {
      const wallet = await createWallet();
      console.log('✅ Wallet created!');
      console.log(`📍 Address: ${wallet.publicKey}`);
      console.log('');
      console.log('⚠️  IMPORTANT: Back up your wallet file!');
      console.log('⚠️  Never share your secret key!');
    } catch (e) {
      console.log(`⚠️  ${e.message}`);
      const existing = loadWallet();
      if (existing) {
        console.log(`📍 Existing wallet: ${existing.publicKey}`);
      }
    }
  },

  async address() {
    const address = getAddress();
    if (address) {
      console.log(address);
    } else {
      console.log('❌ No wallet found. Run: solana-agent-kit init');
    }
  },

  async balance(args) {
    const wallet = loadWallet();
    if (!wallet) {
      console.log('❌ No wallet found. Run: solana-agent-kit init');
      return;
    }

    const address = args.address || wallet.publicKey;
    const token = args.token?.toUpperCase();

    console.log(`\n💰 Balances for ${address.slice(0, 8)}...${address.slice(-8)}`);
    console.log('━'.repeat(50));

    try {
      const client = createClient();

      if (token) {
        // Specific token
        if (token === 'SOL') {
          const balance = await client.getBalance(address);
          const price = await getTokenPrice('SOL');
          const value = price ? ` ($${(balance * price).toFixed(2)})` : '';
          console.log(`SOL: ${balance.toFixed(6)}${value}`);
        } else {
          const tokenInfo = TOKENS[token];
          if (!tokenInfo) {
            console.log(`❌ Unknown token: ${token}`);
            return;
          }
          const balance = await client.getTokenBalance(address, tokenInfo.mint);
          const price = await getTokenPrice(token);
          const value = price ? ` ($${(balance * price).toFixed(2)})` : '';
          console.log(`${token}: ${balance.toFixed(6)}${value}`);
        }
      } else {
        // All balances
        const solBalance = await client.getBalance(address);
        const solPrice = await getTokenPrice('SOL');
        const solValue = solPrice ? ` ($${(solBalance * solPrice).toFixed(2)})` : '';
        console.log(`SOL: ${solBalance.toFixed(6)}${solValue}`);

        // Major tokens (with rate limiting protection)
        for (const [symbol, info] of Object.entries(TOKENS)) {
          if (symbol === 'SOL') continue;
          try {
            const balance = await client.getTokenBalance(address, info.mint);
            if (balance > 0) {
              const price = await getTokenPrice(symbol);
              const value = price ? ` ($${(balance * price).toFixed(2)})` : '';
              console.log(`${symbol}: ${balance.toFixed(6)}${value}`);
            }
          } catch (e) {
            // Skip on rate limit
          }
        }
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
    console.log('');
  },

  async price(args) {
    const token = args._[1]?.toUpperCase() || args.token?.toUpperCase() || 'SOL';
    const price = await getTokenPrice(token);

    if (price) {
      const decimals = token === 'BONK' ? 8 : 4;
      console.log(`${token}: $${price.toFixed(decimals)}`);
    } else {
      console.log(`❌ Could not get price for ${token}`);
    }
  },

  async quote(args) {
    const inputToken = args.from?.toUpperCase() || 'SOL';
    const outputToken = args.to?.toUpperCase() || 'USDC';
    const amount = parseFloat(args.amount) || 1;

    const inputInfo = TOKENS[inputToken];
    const outputInfo = TOKENS[outputToken];

    if (!inputInfo || !outputInfo) {
      console.log('❌ Unknown token. Supported:', Object.keys(TOKENS).join(', '));
      return;
    }

    console.log(`\n💱 Quote: ${amount} ${inputToken} → ${outputToken}`);
    console.log('━'.repeat(50));

    try {
      const quote = await getJupiterQuote(
        inputInfo.mint,
        outputInfo.mint,
        amount,
        inputInfo.decimals
      );

      const outAmount = parseInt(quote.outAmount) / Math.pow(10, outputInfo.decimals);
      const rate = outAmount / amount;

      console.log(`📥 Input:  ${amount} ${inputToken}`);
      console.log(`📤 Output: ${outAmount.toFixed(6)} ${outputToken}`);
      console.log(`📊 Rate:   1 ${inputToken} = ${rate.toFixed(6)} ${outputToken}`);
      console.log(`⚡ Route:  ${quote.routePlan?.length || 1} hop(s)`);
      if (quote.priceImpactPct) {
        console.log(`📉 Impact: ${(quote.priceImpactPct * 100).toFixed(4)}%`);
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
    console.log('');
  },

  async swap(args) {
    const wallet = loadWallet();
    if (!wallet) {
      console.log('❌ No wallet found. Run: solana-agent-kit init');
      return;
    }

    const inputToken = args.from?.toUpperCase() || 'SOL';
    const outputToken = args.to?.toUpperCase() || 'USDC';
    const amount = parseFloat(args.amount) || 1;

    console.log(`\n🔄 Swap: ${amount} ${inputToken} → ${outputToken}`);
    console.log('━'.repeat(50));

    try {
      const swapTx = await executeSwap({
        inputToken,
        outputToken,
        amount
      });

      console.log('');
      console.log('⚠️  SIMULATION MODE (hackathon demo)');
      console.log('');
      console.log('In production with @solana/kit:');
      console.log('1. Get swap transaction from Jupiter');
      console.log('2. Sign with wallet via signTransaction()');
      console.log('3. Send via sendAndConfirmTransaction()');
      console.log('4. Return transaction signature');
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
    console.log('');
  },

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
      console.log('Usage: solana-agent-kit send --to <ADDRESS> --amount <N> [--token TOKEN] [--memo TEXT]');
      return;
    }

    console.log(`\n📤 Send: ${amount} ${token}`);
    console.log('━'.repeat(50));
    console.log(`From:   ${wallet.publicKey.slice(0, 12)}...`);
    console.log(`To:     ${to.slice(0, 12)}...${to.slice(-8)}`);
    console.log(`Amount: ${amount} ${token}`);
    if (memo) console.log(`Memo:   ${memo}`);
    console.log('');

    try {
      const tx = await buildTransferTransaction({ to, amount, memo });
      await sendTransaction(tx);
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
    console.log('');
  },

  async history(args) {
    const wallet = loadWallet();
    if (!wallet) {
      console.log('❌ No wallet found. Run: solana-agent-kit init');
      return;
    }

    const address = args.address || wallet.publicKey;
    const limit = parseInt(args.limit) || 10;

    console.log(`\n📜 Recent transactions for ${address.slice(0, 8)}...`);
    console.log('━'.repeat(50));

    try {
      const client = createClient();
      const signatures = await client.getSignaturesForAddress(address, limit);

      if (signatures.length === 0) {
        console.log('No transactions found.');
      } else {
        signatures.forEach((sig, i) => {
          const date = new Date(sig.blockTime * 1000).toISOString().split('T')[0];
          const status = sig.err ? '❌' : '✅';
          console.log(`${status} ${date} ${sig.signature.slice(0, 20)}...`);
        });
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
    console.log('');
  },

  async config(args) {
    const config = loadConfig();
    console.log('\n⚙️  Configuration');
    console.log('━'.repeat(50));
    console.log(JSON.stringify(config, null, 2));
    console.log('');
  },

  help() {
    console.log(`
🛠️  Solana Agent Kit v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Built with @solana/kit following Solana Foundation guidelines.

COMMANDS:

  init                    Create a new wallet
  address                 Show wallet address
  balance [--token X]     Check balances
  price <TOKEN>           Get token price (Jupiter)
  quote --from X --to Y --amount N
                          Get swap quote (Jupiter)
  swap --from X --to Y --amount N
                          Execute swap (simulation)
  send --to ADDR --amount N [--token X] [--memo M]
                          Send tokens (simulation)
  history [--limit N]     Recent transactions
  config                  Show configuration
  help                    Show this help

EXAMPLES:

  solana-agent-kit init
  solana-agent-kit balance
  solana-agent-kit price SOL
  solana-agent-kit quote --from SOL --to USDC --amount 1
  solana-agent-kit swap --from SOL --to USDC --amount 0.5
  solana-agent-kit send --to 7xKX... --amount 0.1

SUPPORTED TOKENS:

  SOL, USDC, USDT, BONK, JUP, WIF, PYTH

SDK:

  Built with @solana/kit (Solana Foundation framework-kit)
  Following patterns from solana.com/SKILL.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Built by Claw 🦀 for Solana x Colosseum Hackathon
    `);
  }
};

// Main entry
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || 'help';

  if (commands[command]) {
    await commands[command](args);
  } else {
    console.log(`Unknown command: ${command}\n`);
    commands.help();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
