#!/bin/bash
# ============================================
# MindCare — Oracle Cloud Deployment Script
# Run this on a fresh Ubuntu 22.04 Oracle VM
# ============================================

set -e

echo "=============================="
echo "  MindCare Server Setup"
echo "=============================="

# --- CONFIGURATION ---
# Change these before running
APP_DOMAIN="app.mindcare.in"
API_DOMAIN="api.mindcare.in"
DB_NAME="mindcare"
DB_USER="mindcare"
DB_PASS="your_strong_password_here"  # CHANGE THIS
APP_DIR="/home/ubuntu/mindcare"
NODE_VERSION="20"

# --- 1. SYSTEM UPDATE ---
echo "[1/8] Updating system..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx ufw

# --- 2. INSTALL NODE.JS ---
echo "[2/8] Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

echo "Node: $(node -v)"
echo "NPM: $(npm -v)"

# --- 3. INSTALL MYSQL ---
echo "[3/8] Installing MySQL 8..."
sudo apt install -y mysql-server

sudo mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "MySQL database '${DB_NAME}' created."

# --- 4. CLONE & SETUP APP ---
echo "[4/8] Setting up application..."
mkdir -p ${APP_DIR}
cd ${APP_DIR}

# If repo exists, pull latest; otherwise clone
if [ -d ".git" ]; then
  git pull origin main
else
  echo "Copy your project files to ${APP_DIR}"
  echo "Example: scp -r ./healthapp/* ubuntu@your-server:${APP_DIR}/"
  echo "Then re-run this script."
fi

# --- 5. CONFIGURE ENVIRONMENT ---
echo "[5/8] Creating .env file..."
cat > ${APP_DIR}/.env << EOF
DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=3001
CORS_ORIGIN=https://${APP_DOMAIN}
NODE_ENV=production
UPLOAD_DIR=./uploads

# SMTP — configure for password reset emails
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=noreply@mindcare.in
# SMTP_PASS=your-app-password
EOF

echo ".env created. Edit SMTP settings: nano ${APP_DIR}/.env"

# --- 6. BUILD & DEPLOY ---
echo "[6/8] Installing dependencies & building..."
cd ${APP_DIR}
npm install --production=false

# Run database migrations
npx prisma migrate deploy
npx prisma generate

# Seed database (first time only)
if [ ! -f "${APP_DIR}/.seeded" ]; then
  npx tsx prisma/seed.ts
  touch ${APP_DIR}/.seeded
  echo "Database seeded."
fi

# Build Next.js static export
# Uncomment output: 'export' in next.config.js first
npm run build

# Create uploads directory
mkdir -p ${APP_DIR}/uploads

# --- 7. CONFIGURE NGINX ---
echo "[7/8] Configuring Nginx..."

# API reverse proxy
sudo tee /etc/nginx/sites-available/${API_DOMAIN} > /dev/null << EOF
server {
    listen 80;
    server_name ${API_DOMAIN};

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Frontend static files
sudo tee /etc/nginx/sites-available/${APP_DOMAIN} > /dev/null << EOF
server {
    listen 80;
    server_name ${APP_DOMAIN};

    root ${APP_DIR}/out;
    index index.html;

    # Handle Next.js static export routing
    location / {
        try_files \$uri \$uri.html \$uri/ /index.html;
    }

    # Cache static assets
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/${API_DOMAIN} /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/${APP_DOMAIN} /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# --- 8. START WITH PM2 ---
echo "[8/8] Starting API with PM2..."
cd ${APP_DIR}
pm2 delete mindcare-api 2>/dev/null || true
pm2 start src/server.ts --name mindcare-api --interpreter npx --interpreter-args "tsx"
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# --- FIREWALL ---
echo "Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# --- SSL (run after DNS is pointed) ---
echo ""
echo "=============================="
echo "  Setup Complete!"
echo "=============================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Point DNS records in Squarespace:"
echo "   ${APP_DOMAIN} → A record → $(curl -s ifconfig.me)"
echo "   ${API_DOMAIN} → A record → $(curl -s ifconfig.me)"
echo ""
echo "2. Wait for DNS propagation (5-30 minutes)"
echo ""
echo "3. Install SSL certificates:"
echo "   sudo certbot --nginx -d ${APP_DOMAIN} -d ${API_DOMAIN}"
echo ""
echo "4. Configure SMTP for password reset emails:"
echo "   nano ${APP_DIR}/.env"
echo ""
echo "5. Update CORS_ORIGIN in .env if domain changes"
echo ""
echo "API: https://${API_DOMAIN}/api/v1/health"
echo "APP: https://${APP_DOMAIN}"
echo ""
echo "PM2 commands:"
echo "  pm2 status          — check running processes"
echo "  pm2 logs            — view API logs"
echo "  pm2 restart all     — restart after code changes"
echo ""
