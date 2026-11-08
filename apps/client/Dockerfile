# Multi-stage Dockerfile for Conversio Next.js Client
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests across monorepo workspaces
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/client/package*.json ./apps/client/

# Install build dependencies
RUN npm ci

# Copy sources
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/client/ ./apps/client/

# Build shared package and Next.js client
RUN npm --workspace=@conversio/shared run build
RUN npm --workspace=@conversio/client run build

# Production Runner stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/client/package*.json ./apps/client/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/client/.next ./apps/client/.next
COPY --from=builder /app/apps/client/public ./apps/client/public

EXPOSE 3000

CMD ["npm", "--workspace=@conversio/client", "run", "start"]

