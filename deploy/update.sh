#!/bin/bash
# ================================================================
#  ambrin — Code Update Script
#  Run after pushing new code to git
#  Usage: ./deploy/update.sh
# ================================================================

set -e

APP_DIR="/home/ubuntu/ambrin"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "================================================================"
echo "  ambrin — Deploying Update"
echo "================================================================"
echo "  Started at: $(date)"
echo ""

cd ${APP_DIR}

# ── 1. Pull latest code ───────────────────────────────────────────
log "Pulling latest code from GitHub..."
git pull origin main || err "git pull failed. Check your GitHub credentials."

# ── 2. Install dependencies ───────────────────────────────────────
log "Installing Node.js dependencies..."
npm install --no-audit --no-fund 2>/dev/null

# ── 3. Run database migrations ────────────────────────────────────
log "Running database migrations..."
npx prisma migrate deploy
npx prisma generate
log "Migrations complete."

# ── 4. Build frontend ─────────────────────────────────────────────
log "Building Next.js frontend..."
npm run build
log "Frontend built."

# ── 5. Restart API (zero-downtime reload) ─────────────────────────
log "Reloading API (zero-downtime)..."
pm2 reload ecosystem.config.js --update-env || pm2 restart ambrin-api
log "API reloaded."

# ── 6. Reload Nginx ───────────────────────────────────────────────
sudo nginx -t && sudo systemctl reload nginx 2>/dev/null || warn "Nginx reload failed — check config."

echo ""
echo "================================================================"
echo "  Update complete at $(date)"
echo "================================================================"
echo ""
pm2 status
echo ""
echo "  Useful commands:"
echo "    pm2 logs ambrin-api     — tail live logs"
echo "    pm2 monit               — real-time process monitor"
echo ""
