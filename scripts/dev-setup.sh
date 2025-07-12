#!/bin/bash

# Development Setup Script for Job Application Assistant
# This script sets up the complete local development environment with Temporal

set -euo pipefail

# Color codes for output
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

# Check if we're in the correct directory
if [[ ! -f "docker-compose.yml" ]]; then
    log_error "Please run this script from the project root directory."
    exit 1
fi

# Function to check if a service is healthy
check_service_health() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for $service to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps $service | grep -q "healthy"; then
            log_success "$service is healthy!"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "$service failed to become healthy after $max_attempts attempts"
            return 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# Function to wait for a port to be available
wait_for_port() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for $service on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            log_success "$service is available on port $port!"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "$service failed to start on port $port after $max_attempts attempts"
            return 1
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
}

# Main setup function
main() {
    log_info "🚀 Starting Job Application Assistant Development Environment"
    log_info "This includes PostgreSQL, Temporal (v1.19.2), and supporting services"
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. Please install pnpm and try again."
        exit 1
    fi
    
    # Install dependencies
    log_info "Installing dependencies..."
    pnpm install
    
    # Create .env file if it doesn't exist
    if [[ ! -f "backend/.env" ]]; then
        log_info "Creating backend/.env file..."
        cat > backend/.env << EOF
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=job_assistant

# Temporal Configuration (Local Development)
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here

# Application Settings
GRACE_PERIOD_DAYS=7
DEFAULT_DEADLINE_WEEKS=2
NODE_ENV=development
EOF
        log_success "Created backend/.env file"
        log_warning "Please update GEMINI_API_KEY in backend/.env with your actual API key"
    fi
    
    # Start infrastructure services
    log_info "Starting infrastructure services (PostgreSQL, Temporal, Redis)..."
    docker-compose up -d postgres redis temporal temporal-web
    
    # Wait for services to be healthy
    check_service_health "postgres" || exit 1
    check_service_health "temporal" || exit 1
    
    # Wait for ports to be available
    wait_for_port 5432 "PostgreSQL" || exit 1
    wait_for_port 7233 "Temporal Server" || exit 1
    wait_for_port 8080 "Temporal Web UI" || exit 1
    
    # Run database migrations
    log_info "Running database migrations..."
    cd backend
    pnpm run migration:run
    cd ..
    
    # Show service status
    log_success "🎉 Development environment is ready!"
    echo ""
    echo "📋 Service Status:"
    echo "  ✅ PostgreSQL: localhost:5432"
    echo "  ✅ Temporal Server: localhost:7233"
    echo "  ✅ Temporal Web UI: http://localhost:8080"
    echo "  ✅ Redis: localhost:6379"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Start the backend API:"
    echo "     cd backend && pnpm run start:dev"
    echo ""
    echo "  2. Start the frontend (in another terminal):"
    echo "     cd frontend && pnpm run dev"
    echo ""
    echo "  3. Start the Temporal worker (in another terminal):"
    echo "     cd backend && pnpm run worker:dev"
    echo ""
    echo "🌐 Access Points:"
    echo "  - Backend API: http://localhost:3001"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Temporal Web UI: http://localhost:8080"
    echo "  - API Documentation: http://localhost:3001/api"
    echo ""
    echo "📚 View logs:"
    echo "  docker-compose logs -f temporal"
}

# Run cleanup on exit
cleanup() {
    log_info "Cleaning up..."
}

trap cleanup EXIT

# Run main function
main "$@" 