# x402-mcp

> Cross-exchange crypto market structure for AI agents. 20 exchanges, 26 fixed Pillar tokens plus any-token light coverage, 7 tools - light coverage, snapshot, orderflow, macro regime, full analysis, address risk, and API info. Free via MCP.

[![npm version](https://img.shields.io/npm/v/@tunedforai/x402-mcp.svg)](https://www.npmjs.com/package/@tunedforai/x402-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`x402-mcp` is a stdio MCP server that exposes [x402.tunedfor.ai](https://x402.tunedfor.ai) - a real-time crypto market structure API - as 7 tools any MCP-compatible client (Claude Desktop, Cursor, Cline, Windsurf, Claude Code) can call. Free via MCP for testing and low-frequency queries; paid REST at the same endpoints for production agents that need higher throughput.

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

All 7 tools are stateless. No API key, no auth, no setup. Just call them.

| Tool | What it returns | REST equivalent | Free via MCP / Paid REST |
|---|---|---|---|
| `marketLight` | Any-token CoinGecko-backed market coverage: price, momentum, rank, liquidity/exchange context, and risk flags. Defaults to `brief=off`; set `brief=full` for Kimi brief | `POST /data/light` | Free / $0.05 |
| `marketSnapshot` | Free 16-field MCP subset: live price, funding, OI, buy/sell ratio, fear/greed | `POST /data` | Free / $0.20 |
| `marketAnalyze` | Macro regime, DXY, VIX, directional signal + confidence | `POST /analyze/market` | Free / $0.25 |
| `marketOrderflow` | Cross-exchange CVD, whale activity, liquidation pressure | `POST /analyze/orderflow` | Free / $0.50 |
| `marketFull` | Snapshot + orderflow + LLM-synthesized analysis | `POST /analyze/full` | Free / $0.75 |
| `addressRisk` | Wallet risk score (mixers, sanctions, counterparties). EVM + Solana | `POST /analyze/address` | Free / $0.25 |
| `apiInfo` | Pricing, quick-start, migration details | `GET /api_info` | Free |

### Token coverage

Major L1s and L2s on the snapshot tier: BTC, ETH, SOL, XRP, BNB, DOGE, ADA, AVAX, LINK, ATOM, DOT, ARB, SUI, OP, LTC.

Extended orderflow tier: the above plus NEAR, AAVE, BCH, HBAR, SHIB, TON, TRX, UNI, XLM.

marketLight supports listed CoinGecko symbols beyond the fixed Pillar token list. Use it for lightweight coverage of tokens such as WCT when the fixed snapshot/orderflow tools reject a symbol. It defaults to `brief=off` for lower latency; request `brief=full` when you specifically need the Kimi-generated prose brief.

Call `apiInfo` from any MCP client for the authoritative current list.

---

## MCP subset contract

marketSnapshot returns a free 16-field MCP subset for agent context and routing. It is not the paid REST `/data` schema.

Expected top-level MCP keys:

- `as_of_utc`
- `token`
- `snapshot`
- `data_freshness`
- `presentation_hint`
- `next_steps`

The `snapshot` object carries the 16 market data fields plus metadata. `token` and `fetched_at` are metadata keys, so a raw JSON key count may show 17 keys under `snapshot` even though the product contract is the 16-field market-data subset.

Do not require `schema_version` or `coverage` from MCP. Those belong to the paid REST contract unless the MCP product contract is intentionally expanded.

Every `marketSnapshot` response must keep the REST CTA:

```text
This is a 16-field MCP subset. Paid REST /data at x402.tunedfor.ai ($0.20 USDC) returns the full 70-field snapshot including on-chain metrics, sentiment, and historical percentiles. No API key, pay-per-call from any wallet.
```

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

## Free MCP vs Paid REST

The MCP wrapper is **free with rate limits** — perfect for testing, prototyping, low-frequency agent workflows, and personal use.

For production agents (24/7 polling, multi-token monitoring, backtesting at scale), use the paid REST endpoints at [x402.tunedfor.ai](https://x402.tunedfor.ai). REST is:

- **Pay-per-call in USDC on Base or Solana** via the [x402 protocol](https://www.x402.org/)
- **No API keys** — your agent signs payment locally; the private key never leaves your machine
- **Rate-limited to 60 calls/minute and 200 calls/hour per wallet** — prevents stripmining; 429 on breach
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
- **On-chain metrics, exchange flows, whale ratios:** licensed third-party institutional data
- **Cross-exchange orderflow (CVD, whale bars, liq aggregations):** WebSocket aggregator across 20 exchanges into InfluxDB, normalized into 1-minute bars
- **Macro context (DXY, VIX, Treasury yields):** FRED + Finviz
- **Fear & Greed Index:** alternative.me

We don't redistribute raw exchange data — we serve derived, computed aggregates. All raw source fields are transformed into our own composite signals before responses are returned.

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
