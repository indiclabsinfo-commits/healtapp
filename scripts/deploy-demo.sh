#!/bin/bash
set -e

SSH_KEY=~/.ssh/healthapp_instance
VM=opc@140.238.249.58
REMOTE_DIR=/home/opc/mindcare-demo
PM2_WEB=demo-web
PM2_API=demo-api

echo "▶ Deploying to DEMO (demo.snowflakescounselling.com)..."

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

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $VM "
  cd $REMOTE_DIR
  export NEXT_PUBLIC_API_URL=https://demo.snowflakescounselling.com/api/v1
  npm install --silent
  npm run build
  pm2 restart $PM2_WEB $PM2_API --update-env
  echo 'PM2 restarted'
"

echo "✅ Demo deploy complete → https://demo.snowflakescounselling.com"
