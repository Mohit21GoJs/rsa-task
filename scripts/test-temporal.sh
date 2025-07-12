#!/bin/bash

# Test script for Temporal setup (simplified temporal-render-simple style)
set -e

echo "🔍 Testing Temporal Setup (simplified single database server)..."

# Stop any existing services
echo "Stopping existing services..."
docker-compose down

# Start PostgreSQL databases first
echo "Starting PostgreSQL databases..."
docker-compose up -d postgres temporal-db

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL databases to be ready..."
sleep 15

# Test PostgreSQL connections
echo "Testing PostgreSQL connections..."
docker-compose exec postgres psql -U postgres -c "SELECT 'Application DB Connected' as status;"
docker-compose exec temporal-db psql -U postgres -c "SELECT 'Temporal DB Connected' as status;"

# Create the visibility database
echo "Creating visibility database..."
docker-compose exec temporal-db psql -U postgres -c "CREATE DATABASE temporal_visibility;" || true

# Start Redis
echo "Starting Redis..."
docker-compose up -d redis

# Start Temporal
echo "Starting Temporal server..."
docker-compose up -d temporal

# Monitor Temporal startup
echo "Monitoring Temporal startup..."
docker-compose logs -f temporal &
LOG_PID=$!

# Wait for Temporal to be ready
echo "Waiting for Temporal to start..."
for i in {1..30}; do
    if docker-compose exec temporal tctl cluster health > /dev/null 2>&1; then
        echo "✅ Temporal is healthy!"
        kill $LOG_PID 2>/dev/null || true
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ Temporal failed to start within 5 minutes"
        kill $LOG_PID 2>/dev/null || true
        docker-compose logs temporal
        exit 1
    fi
    
    echo "Attempt $i/30: Still waiting..."
    sleep 10
done

# Start Temporal Web UI
echo "Starting Temporal Web UI..."
docker-compose up -d temporal-ui

echo "✅ Temporal setup complete!"
echo "🌐 Access points:"
echo "  - Temporal Web UI: http://localhost:8080"
echo "  - Temporal Server: localhost:7233"
echo "  - PostgreSQL (App): localhost:5432"
echo "  - PostgreSQL (Temporal): localhost:5433"
echo "  - Redis: localhost:6379" 