#!/usr/bin/env node
/**
 * @tunedforai/x402-mcp
 * stdio MCP wrapper for x402.tunedfor.ai
 * Exposes camelCase tool names - no dots, no parser breakage.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildFooter } from "./contract.js";
const UPSTREAM = "https://x402.tunedfor.ai/mcp/";
// Session management
let sessionId = null;
const ACCEPT = "application/json, text/event-stream";
async function initSession() {
    if (sessionId)
        return sessionId;
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
    if (!sid)
        throw new Error("No mcp-session-id in initialize response");
    sessionId = sid;
    return sessionId;
}
async function parseResponse(res) {
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("text/event-stream")) {
        const text = await res.text();
        const lines = text.split("\n");
        let last = null;
        for (const line of lines) {
            if (line.startsWith("data: "))
                last = line.slice(6).trim();
        }
        if (!last)
            throw new Error("Empty SSE response from upstream");
        return JSON.parse(last);
    }
    return res.json();
}
async function callTool(toolName, args) {
    const sid = await initSession();
    const body = JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolName, arguments: args },
    });
    const doFetch = (sessionIdToUse) => fetch(UPSTREAM, {
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
        if (res.status === 400 || res.status === 404) {
            sessionId = null;
            const sid2 = await initSession();
            res = await doFetch(sid2);
            if (!res.ok)
                throw new Error(`Upstream error: ${res.status}`);
        }
        else {
            throw new Error(`Upstream HTTP ${res.status}`);
        }
    }
    const data = await parseResponse(res);
    if (data.error)
        throw new Error(data.error.message ?? "Upstream RPC error");
    return data.result?.content;
}
function callTimestamp() {
    return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}
function buildHeader(toolName) {
    return `Endpoint: ${toolName}\nCalled at: ${callTimestamp()}\n---\n`;
}
function extractText(toolName, content) {
    const header = buildHeader(toolName);
    const footer = buildFooter(toolName);
    if (Array.isArray(content)) {
        const body = content
            .filter((c) => typeof c === "object" && c !== null && "text" in c)
            .map((c) => c.text)
            .join("\n");
        return header + body + footer;
    }
    return header + JSON.stringify(content, null, 2) + footer;
}
const server = new McpServer({
    name: "x402-crypto-market-structure",
    version: "1.0.0",
});
server.tool("marketSnapshot", "Free 16-field MCP subset of the live crypto market snapshot: price, funding, OI, buy/sell ratio, fear/greed. Paid REST /data returns the full production snapshot. Supports BTC ETH SOL XRP BNB DOGE ADA AVAX LINK ATOM DOT ARB SUI OP LTC AMP ZEC.", { token: z.string().default("BTC").describe("Token symbol, e.g. BTC, ETH, SOL") }, async ({ token }) => {
    const result = await callTool("market_snapshot", { token });
    return { content: [{ type: "text", text: extractText("market_snapshot", result) }] };
});
server.tool("marketAnalyze", "Macro regime plus directional signal and confidence for a token.", { token: z.string().default("BTC").describe("Token symbol") }, async ({ token }) => {
    const result = await callTool("market_analyze", { token });
    return { content: [{ type: "text", text: extractText("market_analyze", result) }] };
});
server.tool("marketOrderflow", "Cross-exchange orderflow: CVD, whale activity, liquidations, and exchange breakdown.", { token: z.string().default("BTC").describe("Token symbol") }, async ({ token }) => {
    const result = await callTool("market_orderflow", { token });
    return { content: [{ type: "text", text: extractText("market_orderflow", result) }] };
});
server.tool("marketFull", "Full market data bundle: snapshot, orderflow, and LLM-generated verdict.", { token: z.string().default("BTC").describe("Token symbol") }, async ({ token }) => {
    const result = await callTool("market_full", { token });
    return { content: [{ type: "text", text: extractText("market_full", result) }] };
});
server.tool("addressRisk", "Risk score for an Ethereum or Solana wallet address.", { address: z.string().describe("Full 42-character Ethereum address or supported Solana address") }, async ({ address }) => {
    const result = await callTool("address_risk", { address });
    return { content: [{ type: "text", text: extractText("address_risk", result) }] };
});
server.tool("apiInfo", "x402 API pricing, quick start guide, and migration details for the pay-per-call REST endpoint.", {}, async () => {
    const result = await callTool("api_info", {});
    return { content: [{ type: "text", text: extractText("api_info", result) }] };
});
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map