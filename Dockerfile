FROM node:20-alpine

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
COPY src ./src
COPY tsconfig.server.json ./

# Compile TypeScript to JavaScript
RUN npx tsc -p tsconfig.server.json

# Expose port
EXPOSE 3001

# Start the Express API
CMD ["node", "dist/server.js"]
