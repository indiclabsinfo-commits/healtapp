#!/bin/bash
set -e

SSH_KEY=~/.ssh/healthapp_instance
VM=opc@140.238.249.58
REMOTE_DIR=/home/opc/mindcare
PM2_WEB=mindcare-web
PM2_API=mindcare-api

echo "▶ Deploying to PRODUCTION (app.snowflakescounselling.com)..."

# Confirm before pushing to production
read -p "⚠️  Deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

# Sync source to VM
rsync -az \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='scripts' \
  --exclude='uploads' \
  /Users/mac/Desktop/healthapp/ \
  $VM:$REMOTE_DIR/

echo "✓ Files synced"

# Build and restart on VM
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VM "
  cd $REMOTE_DIR
  export NEXT_PUBLIC_API_URL=https://app.snowflakescounselling.com/api/v1
  npm install --silent
  npm run build
  pm2 restart $PM2_WEB $PM2_API --update-env
  echo 'PM2 restarted'
"

echo "✅ Production deploy complete → https://app.snowflakescounselling.com"
