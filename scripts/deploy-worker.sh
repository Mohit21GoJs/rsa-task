#!/bin/bash

# Worker Deployment Script
# This script handles the deployment of the background worker service

set -e  # Exit on any error

echo "🔄 Starting worker deployment..."

# Check if environment variables are set
if [ -z "$TEMPORAL_ADDRESS" ] || [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: Required environment variables not set!"
    echo "Required: TEMPORAL_ADDRESS, DATABASE_URL"
    exit 1
fi

# Set NODE_ENV to production
export NODE_ENV=production

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile --prod=false

echo "🔨 Building the application..."
pnpm run build:backend

echo "🔄 Starting the Temporal worker..."
cd backend && node dist/src/worker/temporal-worker.js 