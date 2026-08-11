# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ openssl poppler-utils

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma-engines ./prisma-engines/

# Install ALL dependencies (dev included, so prisma CLI is available at runtime)
RUN npm install --legacy-peer-deps

# Generate Prisma client using pre-downloaded engines (avoids CDN DNS issues in build)
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/prisma-engines/libquery_engine.so.node \
    PRISMA_SCHEMA_ENGINE_BINARY=/app/prisma-engines/schema-engine \
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
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

# Health check using wget (available in Alpine BusyBox)
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -q --spider http://127.0.0.1:3002/ || exit 1

# Run migrations then seed then start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/seed.js 2>/dev/null; npm start"]
