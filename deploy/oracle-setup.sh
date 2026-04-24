#!/bin/bash
# ================================================================
#  ambrin by Snowflakes Counselling
#  Oracle Cloud Ubuntu 22.04 ARM — Full Server Setup Script
#
#  Run once on a fresh Oracle Cloud Ampere A1 VM.
#  Installs: Node.js 20, PostgreSQL 15, Nginx, PM2, Certbot
#
#  Usage:
#    chmod +x oracle-setup.sh
#    ./oracle-setup.sh
# ================================================================

set -e

# ── CONFIGURATION — edit before running ──────────────────────────
APP_DOMAIN="app.ambrin.in"        # Your web app domain
API_DOMAIN="api.ambrin.in"        # Your API domain (can be same domain with /api path)
DB_NAME="ambrin"
DB_USER="ambrin"
DB_PASS="$(openssl rand -base64 24)"   # Auto-generated strong password
APP_DIR="/home/ubuntu/ambrin"
GITHUB_REPO="https://github.com/indiclabsinfo-commits/healtapp.git"
NODE_VERSION="20"
# ─────────────────────────────────────────────────────────────────

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "================================================================"
echo "  ambrin — Oracle Cloud Server Setup"
echo "================================================================"
echo ""
warn "This script will set up the full ambrin server."
warn "Estimated time: 10–15 minutes"
echo ""

# Save DB password before we generate it once
DB_PASS_SAVED="$DB_PASS"

# ── 1. SYSTEM UPDATE ─────────────────────────────────────────────
log "Step 1/9 — Updating system packages..."
sudo apt update -qq && sudo apt upgrade -y -qq
sudo apt install -y -qq curl git nginx certbot python3-certbot-nginx ufw \
     build-essential libssl-dev openssl jq

# ── 2. INSTALL NODE.JS 20 ────────────────────────────────────────
log "Step 2/9 — Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - > /dev/null
sudo apt install -y -qq nodejs
sudo npm install -g pm2 tsx 2>/dev/null
log "Node: $(node -v) | NPM: $(npm -v)"

# ── 3. INSTALL POSTGRESQL 15 ─────────────────────────────────────
log "Step 3/9 — Installing PostgreSQL 15..."
sudo apt install -y -qq postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS_SAVED}';" 2>/dev/null || \
  sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS_SAVED}';"

sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

# Enable pg_trgm for search
sudo -u postgres psql -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" 2>/dev/null || true

log "PostgreSQL database '${DB_NAME}' ready."

# ── 4. CLONE APPLICATION ─────────────────────────────────────────
log "Step 4/9 — Cloning application..."
sudo mkdir -p ${APP_DIR}
sudo chown ubuntu:ubuntu ${APP_DIR}

if [ -d "${APP_DIR}/.git" ]; then
  cd ${APP_DIR} && git pull origin main
  log "Repository updated."
else
  git clone ${GITHUB_REPO} ${APP_DIR} || {
    warn "Git clone failed — you may need to manually copy the project:"
    warn "  scp -r ./healthapp ubuntu@<your-server-ip>:${APP_DIR}"
    warn "Then re-run this script from Step 4 onward."
    mkdir -p ${APP_DIR}
  }
fi

# ── 5. ENVIRONMENT FILE ──────────────────────────────────────────
log "Step 5/9 — Creating production .env..."

JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH=$(openssl rand -base64 48)

cat > ${APP_DIR}/.env << ENVEOF
# ── Database ──────────────────────────────────────────────────────
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS_SAVED}@localhost:5432/${DB_NAME}?schema=public

# ── JWT Auth ──────────────────────────────────────────────────────
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ── Server ────────────────────────────────────────────────────────
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://${APP_DOMAIN}

# ── File Uploads ──────────────────────────────────────────────────
UPLOAD_DIR=./uploads
# Optional: Cloudinary (for persistent photo storage across deploys)
# CLOUDINARY_CLOUD_NAME=your-cloud-name
# CLOUDINARY_API_KEY=your-key
# CLOUDINARY_API_SECRET=your-secret

# ── Email (for password reset) ────────────────────────────────────
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=noreply@snowflakescounselling.com
# SMTP_PASS=your-app-password
ENVEOF

log ".env created."

# ── 6. INSTALL DEPENDENCIES & BUILD ──────────────────────────────
log "Step 6/9 — Installing Node.js dependencies..."
cd ${APP_DIR}
npm install --no-audit --no-fund 2>/dev/null

log "Running database migrations..."
npx prisma migrate deploy
npx prisma generate

# Seed database (only on first setup)
if [ ! -f "${APP_DIR}/.seeded" ]; then
  log "Seeding database with initial data..."
  npx tsx prisma/seed.ts && touch ${APP_DIR}/.seeded
  log "Database seeded successfully."
else
  log "Database already seeded — skipping."
fi

log "Building Next.js frontend..."
npm run build

# Create uploads directory
mkdir -p ${APP_DIR}/uploads
chmod 755 ${APP_DIR}/uploads

# ── 7. PM2 PROCESS MANAGER ───────────────────────────────────────
log "Step 7/9 — Configuring PM2..."
cd ${APP_DIR}

pm2 delete ambrin-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true
sudo systemctl enable pm2-ubuntu 2>/dev/null || true

# ── 8. NGINX ─────────────────────────────────────────────────────
log "Step 8/9 — Configuring Nginx..."

# API virtual host
sudo tee /etc/nginx/sites-available/ambrin-api > /dev/null << 'NGINXAPI'
server {
    listen 80;
    server_name API_DOMAIN_PLACEHOLDER;

    client_max_body_size 20M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINXAPI
sudo sed -i "s/API_DOMAIN_PLACEHOLDER/${API_DOMAIN}/g" /etc/nginx/sites-available/ambrin-api

# Frontend virtual host
sudo tee /etc/nginx/sites-available/ambrin-app > /dev/null << 'NGINXAPP'
server {
    listen 80;
    server_name APP_DOMAIN_PLACEHOLDER;

    root APP_DIR_PLACEHOLDER/out;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    # Next.js static export routing
    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }

    # Cache static assets aggressively
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Uploads proxied to API
    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
NGINXAPP
sudo sed -i "s/APP_DOMAIN_PLACEHOLDER/${APP_DOMAIN}/g" /etc/nginx/sites-available/ambrin-app
sudo sed -i "s|APP_DIR_PLACEHOLDER|${APP_DIR}|g" /etc/nginx/sites-available/ambrin-app

sudo ln -sf /etc/nginx/sites-available/ambrin-api /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/ambrin-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
log "Nginx configured."

# ── 9. FIREWALL ───────────────────────────────────────────────────
log "Step 9/9 — Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
log "Firewall enabled."

# ── SUMMARY ───────────────────────────────────────────────────────
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")

echo ""
echo "================================================================"
echo "  ambrin Server Setup Complete!"
echo "================================================================"
echo ""
echo "  Server IP:  ${SERVER_IP}"
echo "  App domain: ${APP_DOMAIN}"
echo "  API domain: ${API_DOMAIN}"
echo ""
echo "  DB Name:    ${DB_NAME}"
echo "  DB User:    ${DB_USER}"
echo "  DB Pass:    ${DB_PASS_SAVED}   ← save this!"
echo ""
echo "  IMPORTANT: Save the DB password above to a secure location."
echo ""
echo "================================================================"
echo "  NEXT STEPS"
echo "================================================================"
echo ""
echo "  1. Point DNS A records to this server IP: ${SERVER_IP}"
echo "     ${APP_DOMAIN}  →  ${SERVER_IP}"
echo "     ${API_DOMAIN}  →  ${SERVER_IP}"
echo ""
echo "  2. Wait for DNS propagation (5–30 minutes), then install SSL:"
echo "     sudo certbot --nginx -d ${APP_DOMAIN} -d ${API_DOMAIN}"
echo ""
echo "  3. Configure email (for password reset):"
echo "     nano ${APP_DIR}/.env"
echo ""
echo "  4. Test the API:"
echo "     curl http://${API_DOMAIN}/api/v1/health"
echo ""
echo "  Useful commands:"
echo "    pm2 status                  — check running processes"
echo "    pm2 logs ambrin-api         — live API logs"
echo "    pm2 restart ambrin-api      — restart after config change"
echo "    sudo -u postgres psql       — PostgreSQL console"
echo "    ./deploy/update.sh          — pull & redeploy latest code"
echo "    ./deploy/backup.sh          — run manual database backup"
echo ""
