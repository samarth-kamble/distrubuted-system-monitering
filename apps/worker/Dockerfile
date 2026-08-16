FROM oven/bun:1.1-alpine AS base
WORKDIR /usr/src/app

# Copy package descriptors and lockfiles
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/

# Install workspace dependencies
RUN bun install --frozen-lockfile

# Copy shared lib and target worker source code
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker
COPY prisma ./prisma

# Generate Prisma client
RUN bun prisma generate

# Build worker application
RUN bun --filter worker build

CMD ["bun", "--filter", "worker", "start:prod"]
