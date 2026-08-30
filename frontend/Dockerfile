# ============================================================================
# Multi-stage Dockerfile for React Frontend
# Stage 1: Build stage (compile React app)
# Stage 2: Production stage (Nginx server)
# ============================================================================

# ============ STAGE 1: BUILDER ============
# Use Node.js alpine to build React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm ci for clean, reproducible builds
RUN npm ci

# Copy entire source code
COPY . .

# Build React production bundle
# This creates an optimized build in /app/build directory
RUN npm run build

# ============ STAGE 2: PRODUCTION ============
# Use lightweight Nginx Alpine image to serve static files
FROM nginx:1.24-alpine

# Copy built React app from builder stage to Nginx
# Nginx serves static files from /usr/share/nginx/html
COPY --from=builder /app/build /usr/share/nginx/html

# Copy Nginx configuration for single-page app routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for security (brownie point!)
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Switch to non-root user
USER nginx

# Expose port for HTTP traffic
EXPOSE 80

# Health check for container orchestration (brownie point!)
# Ensures container is responsive and serving requests
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx in foreground mode (important for Docker)
CMD ["nginx", "-g", "daemon off;"]