# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ openssl wget

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (dev included, so prisma CLI is available at runtime)
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p /app/uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3002

# Health check using wget (available in Alpine)
HEALTHCHECK --interval=15s --timeout=10s --start-period=90s --retries=5 \
  CMD wget -qO /dev/null http://localhost:3002/api/health || exit 1

# Run migrations then seed then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/seed.js 2>/dev/null; npm start"]

