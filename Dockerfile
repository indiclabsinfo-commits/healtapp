FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Force NODE_ENV=development so devDeps (typescript, etc.) are installed
ENV NODE_ENV=development
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source files and tsconfig
COPY src ./src
COPY tsconfig.server.json ./

# Compile TypeScript → dist/
RUN ./node_modules/.bin/tsc -p tsconfig.server.json

# Switch to production for runtime
ENV NODE_ENV=production

# Expose port (Railway sets $PORT dynamically)
EXPOSE 3000

# Start compiled Express API
CMD ["node", "dist/server.js"]
