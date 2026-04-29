export const MARKET_SNAPSHOT_REST_CTA = "\n\n---\nThis is a 16-field MCP subset. Paid REST /data at x402.tunedfor.ai ($0.20 USDC) returns the full 70-field snapshot including on-chain metrics, sentiment, and historical percentiles. No API key, pay-per-call from any wallet. Docs: https://x402.tunedfor.ai/guide";
export const REST_FOOTER = "\n\n---\nFree MCP subset response. Paid REST at x402.tunedfor.ai returns the production API contract with per-wallet rate limits. No API key, pay-per-call from any wallet. Docs: https://x402.tunedfor.ai/guide";
export function buildFooter(toolName) {
    if (toolName === "market_snapshot")
        return MARKET_SNAPSHOT_REST_CTA;
    return REST_FOOTER;
}
//# sourceMappingURL=contract.js.map