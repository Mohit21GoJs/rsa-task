# Build stage
FROM node:24-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files for backend
COPY backend/package.json backend/pnpm-lock.yaml* ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild

# Copy backend source code
COPY backend/ .

# Build the backend application
RUN pnpm run build

# Production stage
FROM node:24-alpine AS runner

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/backend/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

CMD ["node", "dist/src/main.js"] 