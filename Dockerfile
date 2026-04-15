# Dockerfile for Glama MCP server health checks.
#
# Glama spawns this container, pipes JSON-RPC over stdin/stdout, and runs the
# tools/list introspection request to verify the server responds correctly.
# No environment variables required — tool registrations are local. Network
# calls to https://x402.tunedfor.ai only happen on actual tool invocations,
# which Glama does NOT perform during scoring.
#
# Multi-stage build for smaller final image (~150MB vs ~400MB single-stage).

# ---------- Build stage ----------
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-slim
WORKDIR /app

# Production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled output from build stage
COPY --from=builder /app/dist ./dist

# Stdio MCP — Glama pipes JSON-RPC over stdin/stdout
ENTRYPOINT ["node", "dist/index.js"]
