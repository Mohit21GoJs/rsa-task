#!/bin/bash

# Quick lint check script for local development
# Usage: ./scripts/check-lint.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

log_info "Starting lint configuration check..."

# Change to project root
cd "$ROOT_DIR"

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Check pnpm version
PNPM_VERSION=$(pnpm --version)
log_info "Using pnpm version: $PNPM_VERSION"

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    log_info "Installing dependencies..."
    pnpm install
fi

# Test ESLint configurations
log_info "🔍 Validating ESLint configurations..."

# Check backend ESLint config
log_info "Checking backend ESLint configuration..."
if cd backend && npx eslint --print-config src/main.ts > /dev/null 2>&1; then
    log_success "✅ Backend ESLint config is valid"
else
    log_error "❌ Backend ESLint config is invalid"
    log_info "Trying to diagnose the issue..."
    cd backend && npx eslint --print-config src/main.ts 2>&1 || true
    exit 1
fi

# Check frontend ESLint config
log_info "Checking frontend ESLint configuration..."
cd ../frontend
if npx eslint --print-config next.config.ts > /dev/null 2>&1; then
    log_success "✅ Frontend ESLint config is valid"
else
    log_error "❌ Frontend ESLint config is invalid"
    log_info "Trying to diagnose the issue..."
    npx eslint --print-config next.config.ts 2>&1 || true
    exit 1
fi

# Run actual lint checks
cd ..
log_info "🧹 Running lint checks..."

# Backend lint
log_info "Linting backend..."
if pnpm run lint:backend; then
    log_success "✅ Backend lint passed"
else
    log_error "❌ Backend lint failed"
    exit 1
fi

# Frontend lint
log_info "Linting frontend..."
if pnpm run lint:frontend; then
    log_success "✅ Frontend lint passed"
else
    log_error "❌ Frontend lint failed"
    exit 1
fi

log_success "🎉 All lint checks passed!"
log_info "Your code is ready for CI/CD pipeline!"

echo ""
echo "💡 Tips:"
echo "  - Run 'pnpm run lint' to lint both backend and frontend"
echo "  - Run 'pnpm run format' to auto-fix formatting issues"
echo "  - Use 'pnpm run lint:backend --fix' to auto-fix backend issues"
echo "  - Check individual configs with:"
echo "    - cd backend && npx eslint --print-config src/main.ts"
echo "    - cd frontend && npx eslint --print-config next.config.ts" 