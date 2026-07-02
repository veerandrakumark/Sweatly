# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy configurations
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install all dependencies including devDependencies for compiling
RUN npm ci --include-workspace-root

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/

# Compile shared and server
RUN npm run build -w shared
RUN npm run build -w server

# Stage 2: Runtime stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY server/package.json ./server/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=server --include-workspace-root

# Copy compiled folders from builder stage
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 5000

CMD ["npm", "start", "-w", "server"]
