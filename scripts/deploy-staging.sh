#!/bin/bash
set -e

SSH_KEY=~/.ssh/healthapp_instance
VM=opc@140.238.249.58
REMOTE_DIR=/home/opc/mindcare-staging
PM2_WEB=staging-web
PM2_API=staging-api

echo "▶ Deploying to STAGING (staging.snowflakescounselling.com)..."

# Sync source to VM — exclude node_modules, .next build, .git, and env files
rsync -az --delete \
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
  export NEXT_PUBLIC_API_URL=https://staging.snowflakescounselling.com/api/v1
  npm install --silent
  npm run build
  pm2 restart $PM2_WEB $PM2_API --update-env
  echo 'PM2 restarted'
"

echo "✅ Staging deploy complete → https://staging.snowflakescounselling.com"
