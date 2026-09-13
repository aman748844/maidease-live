#!/bin/bash
# MaidEase Live - 1-Click Production VPS Deploy Script
set -e

echo "🚀 Starting MaidEase Live Production Deployment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 process manager..."
    sudo npm install -g pm2
fi

echo "🔨 Building frontend and installing backend dependencies..."
npm run build

echo "⚡ Starting application with PM2..."
pm2 restart maidease-live 2>/dev/null || pm2 start npm --name "maidease-live" -- start
pm2 save

echo "✅ MaidEase Live successfully running in production!"
