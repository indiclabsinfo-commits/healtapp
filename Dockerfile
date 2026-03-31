FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDeps for tsc)
RUN npm ci --include=dev

# Generate Prisma client
RUN npx prisma generate

# Copy source files and tsconfig
COPY src ./src
COPY tsconfig.server.json ./

# Compile TypeScript → dist/
RUN ./node_modules/.bin/tsc -p tsconfig.server.json

# Expose port (Railway sets $PORT dynamically)
EXPOSE 3000

# Start compiled Express API
CMD ["node", "dist/server.js"]
