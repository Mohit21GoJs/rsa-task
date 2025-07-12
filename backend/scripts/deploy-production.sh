#!/bin/bash

# Production Deployment Script
# This script handles database migrations and application deployment

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Check if environment variables are set
if [ -z "$DATABASE_HOST" ] || [ -z "$DATABASE_NAME" ] || [ -z "$DATABASE_USERNAME" ] || [ -z "$DATABASE_PASSWORD" ]; then
    echo "❌ Error: Database environment variables not set!"
    echo "Required: DATABASE_HOST, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD"
    exit 1
fi

# Set NODE_ENV to production
export NODE_ENV=production

echo "📦 Installing dependencies..."
npm ci --only=production

echo "🔨 Building the application..."
npm run build

echo "🗄️ Running database migrations..."
npm run migration:run

echo "🎯 Starting the application..."
npm run start:prod 