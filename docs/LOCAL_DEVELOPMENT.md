# Local Development Guide

This guide will help you set up the Job Application Assistant for local development with Temporal v1.19.2.

## 🏗️ Architecture Overview

The local development environment uses a **hybrid Temporal setup**:

- **Local Development**: Self-hosted Temporal v1.19.2 in Docker
- **Production**: External Temporal cluster (Temporal Cloud, self-managed, etc.)

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Docker** and **Docker Compose**
- **Git** for version control

### 2. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd rsa-task

# Install dependencies
pnpm install

# Run the automated setup script
pnpm run dev:setup
```

The setup script will:

- Install all dependencies
- Start PostgreSQL, Temporal, and Redis services
- Run database migrations
- Create environment configuration

### 3. Manual Setup (Alternative)

If you prefer to set up manually:

```bash
# Install dependencies
pnpm install

# Start infrastructure services
pnpm run dev:services

# Wait for services to be ready
pnpm run dev:services:logs

# Run database migrations
pnpm run migration:run
```

## 🔧 Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
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
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Application Settings
GRACE_PERIOD_DAYS=7
DEFAULT_DEADLINE_WEEKS=2
NODE_ENV=development

# Optional: Server Configuration
PORT=3001

# Optional: Logging
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true

# Optional: Security (for local development)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
TRUST_PROXY=false
HELMET_ENABLED=false
RATE_LIMIT_ENABLED=false
```

## 🚀 Starting the Development Environment

### Option 1: Individual Services

```bash
# Terminal 1: Start infrastructure services
pnpm run dev:services

# Terminal 2: Start the backend API
pnpm run start:backend

# Terminal 3: Start the frontend
pnpm run start:frontend

# Terminal 4: Start the Temporal worker
pnpm run start:worker
```

### Option 2: Combined Services

```bash
# Start infrastructure services
pnpm run dev:services

# Start backend and frontend together
pnpm run start

# In another terminal, start the worker
pnpm run start:worker
```

## 🌐 Access Points

Once everything is running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api
- **Temporal Web UI**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔍 Service Health Checks

### Check if services are running:

```bash
# Check Docker services
docker-compose ps

# Check service logs
pnpm run dev:services:logs

# Check specific service
docker-compose logs temporal
```

### Test API endpoints:

```bash
# Backend health check
curl http://localhost:3001/api/health

# Database health check
curl http://localhost:3001/api/health/db

# Temporal health check
curl http://localhost:3001/api/health/temporal
```

## 🗄️ Database Operations

### Migrations

```bash
# Run pending migrations
pnpm run migration:run

# Create a new migration
pnpm run migration:create -- -n MigrationName

# Revert the last migration
pnpm run migration:revert
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d job_assistant

# View database logs
docker-compose logs postgres
```

## ⚡ Temporal Workflows

### Local Development Features

- **Temporal Server**: v1.19.2 running in Docker
- **Temporal Web UI**: http://localhost:8080
- **Configuration**: PostgreSQL storage
- **Namespace**: `default`

### Common Workflow Operations

```bash
# Start the Temporal worker
pnpm run start:worker

# View worker logs
cd backend && pnpm run worker:dev

# Monitor workflows in the UI
open http://localhost:8080
```

### Temporal CLI (Optional)

If you have Temporal CLI installed:

```bash
# List workflows
temporal workflow list

# Describe a workflow
temporal workflow describe --workflow-id <workflow-id>

# Cancel a workflow
temporal workflow cancel --workflow-id <workflow-id>
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm run test

# Run backend tests only
pnpm run test:backend

# Run frontend tests only
pnpm run test:frontend

# Run tests in watch mode
cd backend && pnpm run test:watch
```

### Integration Tests

```bash
# Run E2E tests
cd backend && pnpm run test:e2e

# Run specific test suite
cd backend && pnpm run test -- --testNamePattern="Application"
```

## 🔧 Development Tools

### Code Quality

```bash
# Lint all code
pnpm run lint

# Format all code
pnpm run format

# Fix linting issues
pnpm run lint:backend -- --fix
```

### Building

```bash
# Build all projects
pnpm run build

# Build backend only
pnpm run build:backend

# Build frontend only
pnpm run build:frontend
```

## 🐛 Troubleshooting

### Common Issues

1. **Temporal not starting**:

   ```bash
   # Check logs
   docker-compose logs temporal

   # Restart services
   docker-compose restart temporal
   ```

2. **Database connection issues**:

   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres

   # Check database logs
   docker-compose logs postgres
   ```

3. **Port conflicts**:

   ```bash
   # Check what's using the port
   lsof -i :7233

   # Stop conflicting services
   docker-compose stop
   ```

4. **Permission issues**:
   ```bash
   # Reset Docker volumes
   docker-compose down -v
   docker-compose up -d
   ```

### Clean Reset

```bash
# Stop all services and remove data
pnpm run dev:clean

# Restart everything
pnpm run dev:setup
```

## 📚 Additional Resources

### Temporal Documentation

- [Temporal Documentation](https://docs.temporal.io/)
- [Temporal Web UI Guide](https://docs.temporal.io/web-ui)
- [Temporal CLI](https://docs.temporal.io/cli)

### Development Tools

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeORM Documentation](https://typeorm.io/)

### Docker Commands

```bash
# View running containers
docker-compose ps

# View logs for all services
docker-compose logs

# Restart a specific service
docker-compose restart temporal

# Execute commands in a container
docker-compose exec postgres psql -U postgres
```

## 🤝 Contributing

When contributing to local development:

1. **Test your changes** with the full stack running
2. **Run tests** before submitting PRs
3. **Check Temporal workflows** in the Web UI
4. **Update documentation** if you change the setup process

## 🔄 Production Differences

Remember that production uses:

- **External Temporal cluster** (not Docker)
- **Managed PostgreSQL** (not local Docker)
- **Environment variables** for configuration
- **Different scaling** and monitoring setup

The application code is designed to work seamlessly in both environments by using environment variables for configuration.
