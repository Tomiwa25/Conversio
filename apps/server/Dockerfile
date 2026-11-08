# Multi-stage Dockerfile for Conversio Backend Signaling & API Server
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests across monorepo workspaces
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

# Install build dependencies
RUN npm ci

# Copy sources
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/server/ ./apps/server/

# Build shared package and server
RUN npm --workspace=@conversio/shared run build
RUN npm --workspace=@conversio/server run build

# Production Runner stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 4000

CMD ["node", "apps/server/dist/index.js"]

