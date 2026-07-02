# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package.json package-lock.json* ./

# Copy package configurations
COPY client/package.json ./client/
COPY shared/package.json ./shared/

# Install dependencies
RUN npm ci --include-workspace-root

# Copy source files
COPY shared/ ./shared/
COPY client/ ./client/

# Build shared package then client
RUN npm run build -w shared
RUN npm run build -w client

# Stage 2: Serve stage
FROM nginx:1.25-alpine

# Copy built static files to nginx public folder
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy custom nginx routing config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
