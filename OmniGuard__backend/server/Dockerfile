# ══════════════════════════════════════════════════════
#  OmniGuard API Server — Production Dockerfile
#  Multi-stage build: install deps → production image
# ══════════════════════════════════════════════════════

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S omniguard && \
    adduser -S omniguard -u 1001

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create logs directory
RUN mkdir -p logs && chown -R omniguard:omniguard /app

# Switch to non-root user
USER omniguard

# Expose API port (7860 required for Hugging Face Spaces)
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7860/api/health || exit 1

# Start server
ENV NODE_ENV=production
ENV PORT=7860
CMD ["node", "server.js"]
