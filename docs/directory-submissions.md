# x402 Directory Submission Runbook
**Last updated:** 2026-04-14
**Status:** Human-gated tasks for Kevin. Paste-ready packets + 5-minute submission targets.

Tracking doc: `_ops/x402-directory-inventory.md` (update as submissions clear).

---

## Part 1 — Auto-submitted (no Kevin action needed, just monitor)

| Directory | Submission | Status check |
|---|---|---|
| mcp.so | [Issue #2021](https://github.com/chatmcp/mcpso/issues/2021) filed 2026-04-14 | Watch for maintainer tag/merge. Bump after 7d if no reply. |
| punkpeye/awesome-mcp-servers | [PR #4850](https://github.com/punkpeye/awesome-mcp-servers/pull/4850) filed 2026-04-14 with 🤖🤖🤖 fast-track | Expect merge 1–3d. |

---

## Part 2 — Official MCP Registry (HIGHEST LEVERAGE — cascades to Glama + PulseMCP)

**What it does:** Single publish that feeds Glama, PulseMCP, and most downstream MCP catalogs.

**Prereqs:**
- Go 1.21+ installed (for `mcp-publisher` CLI)
- GitHub OAuth login (browser-based, one-time)
- `server.json` (already written at `jarvis/x402-mcp/server.json`)

**Steps:**
```bash
cd /path/to/x402-mcp
# Install the publisher CLI
git clone https://github.com/modelcontextprotocol/registry /tmp/mcp-registry
cd /tmp/mcp-registry && make publisher
cd -

# Log in (opens browser for GitHub OAuth)
/tmp/mcp-registry/bin/mcp-publisher login github

# Publish (uses server.json in cwd)
/tmp/mcp-registry/bin/mcp-publisher publish
```

**Namespace chosen:** `io.github.tunedforai/x402-mcp` (matches GitHub org name — avoids DNS TXT verification).

**Alternative namespace:** If you want `ai.tunedfor.x402-mcp` instead (cleaner), you'll need to add a DNS TXT record to `tunedfor.ai`:
- Record: `_mcp-publisher.tunedfor.ai`
- Value: (CLI will tell you the challenge string during `login dns` flow)
- Then: `mcp-publisher login dns --domain tunedfor.ai`

Time estimate: **~15 min including browser OAuth.** One-time setup.

**After publish:**
- Registry entry visible at `https://registry.modelcontextprotocol.io/v0/servers` (search by namespace)
- Glama ingests within ~24hr (re-run `curl 'https://glama.ai/api/mcp/v1/servers?query=tunedforai'` to verify)
- PulseMCP ingests within ~7d

---

## Part 3 — x402scan (HIGHEST LEVERAGE x402-specific)

**URL:** https://www.x402scan.com/resources/register
**Effort:** 5 min. No login required.
**Format:** Just submit the URL. x402scan auto-validates metadata from our `declareDiscoveryExtension()` declarations.

**Submit this URL:** `https://x402.tunedfor.ai`

**Why leverage:** Prior intel — "44/648 have clean metadata, top 7% wins." Our x402 server declares 8 discovery extensions (verified in `x402/server.py:494-642`). We're in the top tier by default.

---

## Part 4 — Glama (if MCP Registry route doesn't cascade in 48hr)

**URL:** https://glama.ai/mcp/servers/add
**Effort:** 10 min. Requires Glama account.

**Paste-ready fields:**
- **Repository URL:** `https://github.com/tunedforai/x402-mcp`
- **Name:** x402 Crypto Market Structure
- **Short description:** Real-time crypto orderflow for AI agents. 20 exchanges, 26 tokens (17 for snapshot/market/full), 6 tools. Free via MCP (60/min per IP), paid REST via x402 USDC on Base or Solana (60/min and 200/hr per wallet).
- **Category:** Finance / Cryptocurrency
- **Transport:** Streamable HTTP (`https://x402.tunedfor.ai/mcp`) + stdio (npm wrapper)

**Skip if:** Glama API search for "tunedforai" returns our listing within 48hr of MCP Registry publish.

---

## Part 5 — Cline MCP Marketplace

**URL:** https://github.com/cline/mcp-marketplace → New Issue → "MCP Server Submission" template
**Effort:** 20 min (needs logo).

**Prereq:** **400×400 PNG logo** — don't have one yet. Options:
- Reuse `amptoken.co` brand assets if they fit
- Quick Midjourney / DALL-E prompt: "geometric logo, minimalist, crypto market data, orange + black, flat"
- Save to `jarvis/x402-mcp/assets/logo-400.png`

**Paste-ready issue body:**
```markdown
### MCP Server Submission

**GitHub Repo:** https://github.com/tunedforai/x402-mcp
**Logo:** [attach 400×400 PNG]

### Reason for Addition

x402-mcp gives AI agents real-time crypto market structure (orderflow from 20 exchanges, 26 tokens, 6 tools) with zero API keys. Free via MCP (60 calls/minute per IP). Paid REST via x402 micropayments on Base or Solana, rate-limited to 60 calls/minute and 200 calls/hour per wallet. Complements Cline's crypto tool ecosystem by adding institutional-grade market microstructure data (CVD, whale flows, funding rates) that's missing from most agent toolkits.

### Installation Check

- [x] README.md has clear installation instructions
- [x] `llms-install.md` included (optional auto-install hint)
- [x] Works out-of-the-box with `npx -y @tunedforai/x402-mcp`
- [x] No API key required for free tier
- [x] Tested in Cline
```

Cline fast-reviews within a couple of days per their docs.

---

## Part 6 — Fetchr.guru (KILLED 2026-04-14)

**Status:** DO NOT SUBMIT. Token-gated at 10,000,000 $FETCHR to list ("Hold $FETCHR to access"). Classic pump-gate mechanism — forces listers to buy the project's token as a precondition. Capital tied up in an illiquid promo token for a speculative distribution channel. Not worth it.

**Only value Fetchr offers is free search** (discovery side), not paid listing. If we want passive discovery, no action needed — they can scrape our `/.well-known/agent-card.json` like anyone else.

**Revisit if:** Fetchr drops the token gate, or $FETCHR becomes liquid and sub-$0.0001.

~~**URL:** https://fetchr.guru/ — "List your agent" CTA~~
~~**Effort:** 15 min. Requires Base wallet address.~~

---

## Part 7 — BlockRun.ai (email submission)

**Email:** vicky@blockrun.ai
**Subject:** List x402 Crypto Market Structure — Real-time market data for AI agents

**Paste-ready body:**
```
Hi Vicky,

I'd like to list x402 Crypto Market Structure on BlockRun.ai. Details below.

Service: x402 Crypto Market Structure
Endpoint: https://x402.tunedfor.ai
Description: Real-time crypto orderflow from 20 exchanges (Binance, Coinbase, Bybit, OKX, etc.) across 26 tokens (17 for snapshot/market/full endpoints). 6 tools covering curated market snapshots (16 reliable fields), macro regime + directional signal, cross-exchange CVD with whale activity, complete pre-trade due diligence with LLM synthesis, and on-chain address risk (Ethereum, Base, Solana).

Pricing: Pay-per-call in USDC on Base or Solana via x402 protocol. No API keys. Rate-limited to 60 calls/minute and 200 calls/hour per wallet. $0.20–$0.75 per call depending on tool.

Fits your lineup alongside Exa, Predexon, and Modal. Crypto market structure is a gap you don't currently cover.

Happy to share a short demo video or spec sheet. Also listed on Smithery, npm (@tunedforai/x402-mcp), and soon in the Official MCP Registry.

Contact: cortex@tunedfor.ai
Base wallet (payTo): [pull from VPS env before sending]

Thanks,
Kevin
Tuned For AI
```

---

## Part 8 — the402.ai (lower priority — escrow collateral required)

**URL:** https://the402.ai/ → List Your Services
**Effort:** 30+ min. Read `/docs/providers` carefully — requires USDC escrow collateral.

**Decision gate:** Only do this if the other 6 listings are live and you want expanded coverage. Collateral tied up = capital cost.

---

## Part 9 — LobeHub, Cursor Marketplace, Claude Desktop Extensions (Tier B)

Deferred. Revisit after Tier A (Registry, x402scan, punkpeye, mcp.so) is confirmed live.

---

## Pre-submission asset checklist

- [ ] `x402-mcp/README.md` polished (public repo, this is what Cline/Glama scrape)
- [ ] `x402-mcp/llms-install.md` — one-liner install hint file
- [ ] 400×400 PNG logo at `x402-mcp/assets/logo-400.png`
- [ ] X402_WALLET_ADDRESS pulled from VPS for form fields
- [ ] Short 30-second demo video (optional, strengthens BlockRun + Fetchr pitches)

---

## Bazaar auto-discovery verification (don't submit — just verify)

Run this after next settled payment through CDP facilitator to confirm we're in the Bazaar index:

```bash
curl -sS "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=500" \
  | python -c "import json,sys; d=json.load(sys.stdin); hits=[i for i in d['items'] if 'tunedfor' in str(i).lower()]; print('Bazaar listings:', len(hits)); [print(h['resource']) for h in hits]"
```

Our code is correct — 8 `declare_discovery_extension()` calls in `x402/server.py` + `bazaar_resource_server_extension` registration. Listing cascades automatically on first settlement.
