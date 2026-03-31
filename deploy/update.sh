#!/bin/bash
# ============================================
# MindCare — Quick Update Script
# Run after pushing code changes
# ============================================

set -e

APP_DIR="/home/ubuntu/mindcare"
cd ${APP_DIR}

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Running migrations..."
npx prisma migrate deploy
npx prisma generate

echo "Building frontend..."
npm run build

echo "Restarting API..."
pm2 restart mindcare-api

echo "Done! App updated."
pm2 status
