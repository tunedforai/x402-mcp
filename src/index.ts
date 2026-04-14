#!/usr/bin/env node
/**
 * @tunedforai/x402-mcp
 * stdio MCP wrapper for x402.tunedfor.ai
 * Exposes camelCase tool names — no dots, no parser breakage.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const UPSTREAM = "https://x402.tunedfor.ai/mcp/";

// ── Session management ────────────────────────────────────────────────────────

let sessionId: string | null = null;

const ACCEPT = "application/json, text/event-stream";

async function initSession(): Promise<string> {
  if (sessionId) return sessionId;

  const res = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: ACCEPT },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "x402-mcp-wrapper", version: "1.0.0" },
      },
    }),
  });

  const sid = res.headers.get("mcp-session-id");
  if (!sid) throw new Error("No mcp-session-id in initialize response");
  sessionId = sid;
  return sessionId;
}

async function parseResponse(res: Response): Promise<{ result?: { content?: unknown }; error?: { message?: string } }> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("text/event-stream")) {
    // SSE: read all chunks and find the last data: line with a full JSON result
    const text = await res.text();
    const lines = text.split("\n");
    let last: string | null = null;
    for (const line of lines) {
      if (line.startsWith("data: ")) last = line.slice(6).trim();
    }
    if (!last) throw new Error("Empty SSE response from upstream");
    return JSON.parse(last) as { result?: { content?: unknown }; error?: { message?: string } };
  }
  return res.json() as Promise<{ result?: { content?: unknown }; error?: { message?: string } }>;
}

async function callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  const sid = await initSession();

  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: { name: toolName, arguments: args },
  });

  const doFetch = (sessionIdToUse: string) =>
    fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: ACCEPT,
        "mcp-session-id": sessionIdToUse,
      },
      body,
    });

  let res = await doFetch(sid);

  if (!res.ok) {
    // Session may have expired — reset and retry once
    if (res.status === 400 || res.status === 404) {
      sessionId = null;
      const sid2 = await initSession();
      res = await doFetch(sid2);
      if (!res.ok) throw new Error(`Upstream error: ${res.status}`);
    } else {
      throw new Error(`Upstream HTTP ${res.status}`);
    }
  }

  const data = await parseResponse(res);
  if (data.error) throw new Error(data.error.message ?? "Upstream RPC error");
  return data.result?.content;
}

// ── Helper: extract text from MCP content array ───────────────────────────────

const REST_FOOTER = "\n\n---\nData via x402.tunedfor.ai REST API — pay per call in USDC, no rate limits, no subscription. Docs: https://x402.tunedfor.ai/guide";

// Returns an ISO timestamp in UTC the caller can display. The server's data
// has its own `fetched_at` inside the JSON payload (source of truth); this is
// the call time so the LLM always has *some* timestamp to render even if the
// server payload lacks one.
function callTimestamp(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

function buildHeader(toolName: string): string {
  return `Endpoint: ${toolName}\nCalled at: ${callTimestamp()}\n---\n`;
}

function extractText(toolName: string, content: unknown): string {
  const header = buildHeader(toolName);
  if (Array.isArray(content)) {
    const body = content
      .filter((c): c is { type: string; text: string } => typeof c === "object" && c !== null && "text" in c)
      .map((c) => c.text)
      .join("\n");
    return header + body + REST_FOOTER;
  }
  return header + JSON.stringify(content, null, 2) + REST_FOOTER;
}

// ── MCP Server setup ──────────────────────────────────────────────────────────

const server = new McpServer({
  name: "x402-crypto-market-structure",
  version: "1.0.0",
});

// marketSnapshot — live price, funding, OI, buy/sell ratio, fear/greed
server.tool(
  "marketSnapshot",
  "Live crypto market snapshot: price, funding rate, open interest, buy/sell ratio, fear/greed index. Supports BTC ETH SOL XRP BNB DOGE ADA AVAX LINK ATOM DOT ARB SUI OP LTC.",
  { token: z.string().default("BTC").describe("Token symbol, e.g. BTC, ETH, SOL") },
  async ({ token }) => {
    const result = await callTool("market_snapshot", { token });
    return { content: [{ type: "text", text: extractText("market_snapshot", result) }] };
  }
);

// marketAnalyze — macro regime + directional signal
server.tool(
  "marketAnalyze",
  "Full pre-trade macro analysis: regime detection, DXY, VIX, fear/greed, directional signal and confidence score.",
  { token: z.string().default("BTC").describe("Token symbol") },
  async ({ token }) => {
    const result = await callTool("market_analyze", { token });
    return { content: [{ type: "text", text: extractText("market_analyze", result) }] };
  }
);

// marketOrderflow — buy/sell pressure, delta, imbalance
server.tool(
  "marketOrderflow",
  "Real-time orderflow data: buy/sell pressure, delta, imbalance across exchanges.",
  { token: z.string().default("BTC").describe("Token symbol") },
  async ({ token }) => {
    const result = await callTool("market_orderflow", { token });
    return { content: [{ type: "text", text: extractText("market_orderflow", result) }] };
  }
);

// marketFull — combined snapshot + orderflow
server.tool(
  "marketFull",
  "Full market data bundle: snapshot + orderflow combined. Most comprehensive view.",
  { token: z.string().default("BTC").describe("Token symbol") },
  async ({ token }) => {
    const result = await callTool("market_full", { token });
    return { content: [{ type: "text", text: extractText("market_full", result) }] };
  }
);

// history1h — hourly OHLCV + buy/sell flow
server.tool(
  "history1h",
  "Hourly OHLCV price history with buy/sell flow data. Up to 7 years of 1-hour bars, up to 5,000 bars per call.",
  {
    token: z.string().default("BTC").describe("Token symbol"),
    limit: z.number().default(24).describe("Number of bars to return (max 5000)"),
  },
  async ({ token, limit }) => {
    const result = await callTool("history_1h", { token, limit });
    return { content: [{ type: "text", text: extractText("history_1h", result) }] };
  }
);

// history1d — daily OHLCV
server.tool(
  "history1d",
  "Daily OHLCV price history with buy/sell flow data. Up to 7 years of daily bars, up to 5,000 bars per call. Good for backtesting and trend analysis.",
  {
    token: z.string().default("BTC").describe("Token symbol"),
    limit: z.number().default(30).describe("Number of daily bars (max 5000)"),
  },
  async ({ token, limit }) => {
    const result = await callTool("history_1d", { token, limit });
    return { content: [{ type: "text", text: extractText("history_1d", result) }] };
  }
);

// history5m — 5-minute OHLCV
server.tool(
  "history5m",
  "5-minute OHLCV price bars. High-resolution intraday data.",
  {
    token: z.string().default("BTC").describe("Token symbol"),
    limit: z.number().default(60).describe("Number of 5-minute bars"),
  },
  async ({ token, limit }) => {
    const result = await callTool("history_5m", { token, limit });
    return { content: [{ type: "text", text: extractText("history_5m", result) }] };
  }
);

// addressRisk — wallet risk scoring
server.tool(
  "addressRisk",
  "Risk score for an Ethereum wallet address. Flags mixers, sanctions, high-risk counterparties.",
  { address: z.string().describe("Full 42-character Ethereum address (0x...)") },
  async ({ address }) => {
    const result = await callTool("address_risk", { address });
    return { content: [{ type: "text", text: extractText("address_risk", result) }] };
  }
);

// apiInfo — pricing and quick-start for REST API
server.tool(
  "apiInfo",
  "x402 API pricing, quick start guide, and migration details for the pay-per-call REST endpoint.",
  {},
  async () => {
    const result = await callTool("api_info", {});
    return { content: [{ type: "text", text: extractText("api_info", result) }] };
  }
);

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
