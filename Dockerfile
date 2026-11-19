# Multi-Stage Production Dockerfile for Desi Ride
# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build production client bundle
RUN npm run build

# 2. Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server code and built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/scripts ./scripts

# Create persistent storage directory for SQLite WAL database
RUN mkdir -p /app/server/data

VOLUME ["/app/server/data"]

EXPOSE 4000

CMD ["node", "server/index.mjs"]
