FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy all source files
COPY src ./src
COPY tsconfig.server.json ./

# Expose port (Railway sets $PORT dynamically)
EXPOSE 3000

# Start Express API using tsx
CMD ["npx", "tsx", "src/server.ts"]
