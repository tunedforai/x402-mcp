import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildFooter } from "../dist/contract.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("marketSnapshot footer documents the free 16-field MCP subset and paid REST upgrade", () => {
  const src = read("src/contract.ts");
  const dist = read("dist/contract.js");

  for (const text of [src, dist]) {
    assert.match(text, /This is a 16-field MCP subset\./);
    assert.match(text, /Paid REST \/data at x402\.tunedfor\.ai/);
    assert.match(text, /\$0\.20 USDC/);
    assert.match(text, /full 70-field snapshot/);
    assert.match(text, /No API key, pay-per-call from any wallet\./);
  }
});

test("only market_snapshot receives the 16-field snapshot CTA", () => {
  assert.match(buildFooter("market_snapshot"), /16-field MCP subset/);
  assert.match(buildFooter("market_snapshot"), /full 70-field snapshot/);

  for (const toolName of [
    "market_analyze",
    "market_orderflow",
    "market_full",
    "address_risk",
    "api_info",
  ]) {
    assert.doesNotMatch(buildFooter(toolName), /16-field MCP subset/);
    assert.doesNotMatch(buildFooter(toolName), /full 70-field snapshot/);
    assert.doesNotMatch(buildFooter(toolName), /higher throughput/i);
    assert.match(buildFooter(toolName), /per-wallet rate limits/);
  }
});

test("README codifies MCP as a subset contract, not REST schema parity", () => {
  const readme = read("README.md");

  assert.match(readme, /marketSnapshot returns a free 16-field MCP subset/);
  assert.match(readme, /not the paid REST `\/data` schema/);
  assert.match(readme, /`token` and `fetched_at` are metadata keys/);
  assert.match(readme, /Do not require `schema_version` or `coverage` from MCP/);
});

test("server registry copy names the MCP subset separately from paid REST", () => {
  const server = JSON.parse(read("server.json"));

  assert.match(server.description, /free 16-field MCP subset/i);
  assert.match(server.description, /paid REST \/data/i);
  assert.match(server.description, /full 70-field snapshot/i);
});

test("marketLight exposes the any-token data/light bridge to upstream market_light", () => {
  const src = read("src/index.ts");
  const dist = read("dist/index.js");

  for (const text of [src, dist]) {
    assert.match(text, /server\.tool\(\s*"marketLight"/);
    assert.match(text, /callTool\("market_light", \{ symbol \}\)/);
    assert.match(text, /Any-token CoinGecko-backed market coverage via \/data\/light/);
  }
});

test("README documents seven tools and separates marketLight any-token coverage", () => {
  const readme = read("README.md");

  assert.match(readme, /7 tools/);
  assert.match(readme, /All 7 tools are stateless/);
  assert.match(readme, /\| `marketLight` \| Any-token CoinGecko-backed market coverage/);
  assert.match(readme, /`POST \/data\/light`/);
  assert.match(readme, /marketLight supports listed CoinGecko symbols beyond the fixed Pillar token list/);
});

test("package and registry metadata publish marketLight as version 1.1.4", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const server = JSON.parse(read("server.json"));

  assert.equal(pkg.version, "1.1.4");
  assert.equal(lock.version, "1.1.4");
  assert.equal(lock.packages[""].version, "1.1.4");
  assert.equal(server.version, "1.1.4");
  assert.equal(server.packages[0].version, "1.1.4");
  assert.match(server.description, /7 tools/i);
  assert.match(server.description, /any-token CoinGecko-backed marketLight/i);
  assert.match(server.description, /\/data\/light/i);
});
