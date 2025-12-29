# Multi-stage Dockerfile for JIRA MCP Server
# Stage 1: Build
FROM node:20.15.1-alpine AS builder

# Set working directory
WORKDIR /app

# Install Safe Chain globally (free, no token required)
RUN npm install -g @aikidosec/safe-chain && \
    npm cache clean --force

# Enable Safe Chain for CI/non-interactive environments
RUN safe-chain setup-ci

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for TypeScript build)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20.15.1-alpine

# Set working directory
WORKDIR /app

# Install Safe Chain globally (free, no token required)
RUN npm install -g @aikidosec/safe-chain && \
    npm cache clean --force

# Enable Safe Chain for CI/non-interactive environments
RUN safe-chain setup-ci

# Copy package files
COPY package*.json ./

# Install only production dependencies using Safe Chain protection
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/build ./build

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Start the server
CMD ["node", "build/index.js"]
