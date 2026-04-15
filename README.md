# x402-mcp

> Cross-exchange crypto market structure for AI agents. 20 exchanges, 26 tokens, 9 tools — orderflow, CVD, whale activity, funding/OI, 7-year OHLCV, on-chain address risk. Free via MCP.

[![npm version](https://img.shields.io/npm/v/@tunedforai/x402-mcp.svg)](https://www.npmjs.com/package/@tunedforai/x402-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`x402-mcp` is a stdio MCP server that exposes [x402.tunedfor.ai](https://x402.tunedfor.ai) — a real-time crypto market structure API — as 9 tools any MCP-compatible client (Claude Desktop, Cursor, Cline, Windsurf, Claude Code) can call. Free via MCP for testing and low-frequency queries; paid REST at the same endpoints for production agents that need higher throughput.

---

## Install

### Claude Desktop / Cursor / Windsurf

Add to your MCP config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, equivalent on other OS):

```json
{
  "mcpServers": {
    "x402": {
      "command": "npx",
      "args": ["-y", "@tunedforai/x402-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add x402 -- npx -y @tunedforai/x402-mcp
```

### Cline / Continue / other MCP clients

Use the same `npx -y @tunedforai/x402-mcp` invocation as the stdio command.

### Manual

```bash
npm install -g @tunedforai/x402-mcp
x402-mcp  # runs the stdio server
```

---

## Tools

All 9 tools are stateless. No API key, no auth, no setup. Just call them.

| Tool | What it returns | REST equivalent | Free via MCP / Paid REST |
|---|---|---|---|
| `marketSnapshot` | Live price, funding, OI, buy/sell ratio, fear/greed | `POST /data` | Free / $0.20 |
| `marketAnalyze` | Macro regime, DXY, VIX, directional signal + confidence | `POST /analyze/market` | Free / $0.25 |
| `marketOrderflow` | Cross-exchange CVD, whale activity, liquidation pressure | `POST /analyze/orderflow` | Free / $0.50 |
| `marketFull` | Snapshot + orderflow + LLM-synthesized analysis | `POST /analyze/full` | Free / $0.75 |
| `addressRisk` | Wallet risk score (mixers, sanctions, counterparties). EVM + Solana | `POST /analyze/address` | Free / $0.25 |
| `history1h` | Hourly OHLCV with buy/sell flow split. Up to 5,000 bars, 7-year history | `POST /data/history/1h` | Free / $5.00 |
| `history1d` | Daily OHLCV with buy/sell flow split. Up to 5,000 bars, 7-year history | `POST /data/history/1d` | Free / $5.00 |
| `history5m` | 5-minute OHLCV. High-resolution intraday | `POST /data/history/5m` | Free / $1.00 |
| `apiInfo` | Pricing, quick-start, migration details | `GET /api_info` | Free |

### Token coverage

- **Snapshot tier** (17 tokens): BTC, ETH, SOL, XRP, BNB, DOGE, ADA, AVAX, LINK, ATOM, DOT, ARB, SUI, OP, LTC, AMP, ZEC
- **Orderflow + history tier** (26 tokens): all of the above + NEAR, AAVE, BCH, HBAR, SHIB, TON, TRX, UNI, XLM

---

## Examples

### Pre-trade check

```
You: marketSnapshot BTC
LLM: BTC at $74,180. Buy ratio 58% — bullish lean. Funding rate +0.012%
     (mild long bias). Open interest $14.2B. Fear & Greed: 32 (Fear).
     Snapshot 12 sec old.
```

### Cross-exchange orderflow

```
You: marketOrderflow ETH
LLM: ETH cross-exchange CVD: -$1.2M last hour (sell-side dominant).
     Whale activity: 8 large bars across Binance/Coinbase/Bybit.
     Liquidations: $890K longs, $230K shorts. Pressure: bearish.
```

### Backtest data

```
You: history1d BTC limit=365
LLM: [returns 365 daily bars: open/high/low/close/volume/buy_volume/sell_volume]
```

---

## Free MCP vs Paid REST

The MCP wrapper is **free with rate limits** — perfect for testing, prototyping, low-frequency agent workflows, and personal use.

For production agents (24/7 polling, multi-token monitoring, backtesting at scale), use the paid REST endpoints at [x402.tunedfor.ai](https://x402.tunedfor.ai). REST is:

- **Pay-per-call in USDC on Base or Solana** via the [x402 protocol](https://www.x402.org/)
- **No API keys** — your agent signs payment locally; the private key never leaves your machine
- **No rate limits** — pay for what you use
- **No subscriptions** — no monthly minimums

Call `apiInfo` from any MCP client to get the current pricing schedule, migration guide, and SDK examples.

---

## How x402 payment works (REST tier)

When your agent calls a paid REST endpoint:

1. First request returns `HTTP 402 Payment Required` with the price
2. Agent signs a USDC payment locally (private key never leaves the agent)
3. Agent retries with the payment header attached
4. Server verifies on-chain settlement and returns the data

No accounts, no API keys, no credit cards. Just USDC and a wallet.

---

## Data sources

- **Price + ticker:** OKX, Coinbase public APIs
- **Funding / OI / liquidations:** [Coinalyze](https://coinalyze.net) (commercial license)
- **On-chain metrics, exchange flows, whale ratios:** [Santiment](https://santiment.net) (commercial license)
- **Cross-exchange orderflow (CVD, whale bars, liq aggregations):** WebSocket aggregator across 20 exchanges into InfluxDB, normalized into 1-minute bars
- **Macro context (DXY, VIX, Treasury yields):** FRED + Finviz
- **Fear & Greed Index:** alternative.me

We don't redistribute raw exchange ticks — we serve derived, computed aggregates.

---

## Links

- **Service:** [x402.tunedfor.ai](https://x402.tunedfor.ai)
- **REST docs:** [x402.tunedfor.ai/catalog](https://x402.tunedfor.ai/catalog)
- **Quick-start:** [x402.tunedfor.ai/llms.txt](https://x402.tunedfor.ai/llms.txt)
- **npm:** [@tunedforai/x402-mcp](https://www.npmjs.com/package/@tunedforai/x402-mcp)
- **Smithery:** [smithery.ai/server/@tunedforai/x402-mcp](https://smithery.ai)
- **Issues / requests:** [github.com/tunedforai/x402-mcp/issues](https://github.com/tunedforai/x402-mcp/issues)
- **x402 protocol:** [x402.org](https://www.x402.org/)

---

## License

MIT © Tuned For AI
