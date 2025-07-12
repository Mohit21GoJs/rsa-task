# Job Application Assistant

A job application tracking system built with NestJS, Next.js, and AI-powered features. This is a monorepo containing both backend and frontend applications with a hybrid Temporal setup: local development uses self-hosted Temporal, while production uses external Temporal clusters.

## 🏗️ Project Structure

- **`backend/`**: NestJS API server with Temporal.io workflows
- **`frontend/`**: Next.js web application
- **`temporal/`**: Local development Temporal configuration
- **`infrastructure/`**: Terraform configuration for production deployment

## ✨ Key Features

- 📝 **Application Tracking**: Add, edit, and track job applications
- 🤖 **AI Cover Letters**: Generate personalized cover letters with Google Gemini
- 📊 **Application Analytics**: Visual dashboards and insights
- ⏰ **Smart Reminders**: Background workflows for deadline tracking
- 📱 **Responsive Design**: Mobile-first UI with dark mode support
- 🔄 **Real-time Updates**: Live application status updates
- 🚀 **Production Ready**: Terraform-based infrastructure deployment

## 🛠️ Tech Stack

- **Backend**: NestJS, TypeScript, PostgreSQL, TypeORM
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Workflow Engine**: Temporal.io (local dev: v1.19.2, production: external cluster)
- **AI Integration**: Google Gemini API
- **Infrastructure**: Terraform, Render.io
- **Development**: Docker, pnpm, ESLint, Prettier

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### Environment Setup

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=job_assistant

# Temporal (local development)
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here

# Application Settings
GRACE_PERIOD_DAYS=7
DEFAULT_DEADLINE_WEEKS=2
```

### Development Setup

1. **Clone and Install**:

   ```bash
   git clone <repository-url>
   cd rsa-task
   pnpm install
   ```

2. **Start Infrastructure Services**:

   ```bash
   # Start PostgreSQL and Temporal (local development)
   docker-compose up -d postgres temporal temporal-web

   # Wait for services to be ready
   docker-compose logs -f temporal
   ```

3. **Setup Database**:

   ```bash
   cd backend
   pnpm run migration:run
   pnpm run seed  # Optional: seed with sample data
   ```

4. **Start Development Servers**:

   ```bash
   # Terminal 1: Backend API
   cd backend
   pnpm run start:dev

   # Terminal 2: Frontend
   cd frontend
   pnpm run dev
   ```

5. **Start the Background Worker**:
   ```bash
   # Terminal 3: Temporal worker
   cd backend
   pnpm run worker:dev
   ```

### 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Temporal Web UI**: http://localhost:8080
- **API Documentation**: http://localhost:3001/api

## 📚 Development Guide

### Running Tests

```bash
# Backend tests
cd backend
pnpm run test
pnpm run test:e2e

# Frontend tests
cd frontend
pnpm run test
```

### Database Operations

```bash
# Create migration
cd backend
pnpm run migration:create -- -n MigrationName

# Run migrations
pnpm run migration:run

# Revert migration
pnpm run migration:revert
```

### Temporal Workflows

Local development uses Temporal v1.19.2 running in Docker for a complete development environment. Production uses external Temporal clusters for scalability and reliability.

**Local Development**:

- Temporal Server: `localhost:7233`
- Temporal UI: `localhost:8080`
- Self-contained with PostgreSQL storage

**Production**:

- External Temporal cluster (configured via `TEMPORAL_ADDRESS`)
- Managed service with high availability
- Separate from application infrastructure

## 🏗️ Production Deployment

### Hybrid Temporal Architecture

This project uses a hybrid approach for Temporal:

- **Local Development**: Self-hosted Temporal v1.19.2 in Docker
- **Production**: External Temporal cluster (Temporal Cloud, self-managed, etc.)

### Infrastructure Setup

1. **Terraform Configuration**:

   ```bash
   cd infrastructure
   terraform init
   terraform plan
   terraform apply
   ```

2. **Environment Variables**:

   ```env
   # Production environment variables
   TEMPORAL_ADDRESS=your-external-temporal-cluster:7233
   TEMPORAL_NAMESPACE=production
   GEMINI_API_KEY=your_production_gemini_key
   ```

3. **Deployment**:

   ```bash
   # Automated deployment via GitHub Actions
   git push origin main

   # Manual deployment
   ./scripts/deploy-terraform.sh
   ```

## 🔧 Configuration

### Local Development Services

The `docker-compose.yml` includes:

- **PostgreSQL**: Database for applications
- **Temporal Server**: Workflow orchestration (v1.19.2)
- **Temporal Web UI**: Workflow monitoring
- **Redis**: Temporal dependencies

### Production Services

The Terraform configuration deploys:

- **Backend API**: NestJS application
- **Frontend**: Next.js web application
- **Background Worker**: Temporal worker connecting to external cluster
- **PostgreSQL**: Managed database

## 📁 Project Structure

```
rsa-task/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── applications/       # Application management
│   │   ├── llm/               # AI integration
│   │   ├── workflow/          # Temporal workflows
│   │   ├── worker/            # Temporal workers
│   │   └── ...
│   └── ...
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js app router
│   │   ├── components/        # React components
│   │   └── ...
│   └── ...
├── temporal/                   # Local development only
│   ├── development-sql.yaml   # Temporal config
│   └── Dockerfile            # Custom temporal image
├── infrastructure/             # Terraform configs
│   ├── main.tf               # Main infrastructure
│   ├── variables.tf          # Variables
│   └── ...
└── docker-compose.yml         # Local development services
```

## 🔄 Workflow Architecture

### Local Development Flow

1. **Docker Compose**: Starts Temporal server locally
2. **Backend Worker**: Connects to local Temporal
3. **Workflows**: Execute on local Temporal cluster
4. **UI**: Monitor workflows via Temporal Web UI

### Production Flow

1. **External Temporal**: Managed Temporal cluster
2. **Background Worker**: Deployed to Render.io
3. **Workflows**: Execute on external cluster
4. **Monitoring**: External Temporal UI/dashboard

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

- Check the [documentation](docs/)
- Create an issue in the repository
- Review the [deployment guide](DEPLOY.md)

---

**🎯 Happy Job Hunting!** This tool helps you stay organized and efficient in your job search journey.
