# ============================================================================
# Multi-stage Dockerfile for Node.js Express Backend
# Stage 1: Build stage (install dependencies)
# Stage 2: Production stage (minimal runtime)
# ============================================================================

# ============ STAGE 1: BUILDER ============
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm ci (cleaner than npm install)
# npm ci = clean install, ensures exact dependency versions
RUN npm ci --only=production

# ============ STAGE 2: PRODUCTION ============
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy production dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy package files
COPY package*.json ./

# Copy application code
COPY . .

# Create non-root user for security (brownie point!)
# Running as root inside container is a security risk
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check for Docker orchestration (brownie point!)
# Helps Docker/Kubernetes know if the container is healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the application
CMD ["node", "server.js"]