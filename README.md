# Job Application Assistant

A job application tracking system built with NestJS, Temporal.io workflows, and AI-powered cover letter generation. This is a monorepo containing both backend and frontend applications.

## 🏗️ Architecture

This project is structured as a monorepo with:

- **`backend/`**: NestJS API server with Temporal.io workflows
- **`frontend/`**: Frontend application (React/Next.js)
- **`temporal/`**: Temporal.io workflow definitions and workers
- **Docker & Infrastructure**: Ready for deployment

## Features

- 📝 **Application Management**: Create, update, and track job applications
- 🤖 **AI Cover Letters**: Automatically generate cover letters using Google Gemini
- ⏰ **Smart Reminders**: Temporal.io workflows for deadline tracking
- 🗄️ **Auto-archiving**: Automatically archive expired applications
- 📊 **Status Tracking**: Monitor application progress (Pending, Interview, Offer, etc.)
- 🔔 **Notifications**: Get notified about important deadlines
- 📚 **API Documentation**: Comprehensive Swagger documentation

## Tech Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Workflow Engine**: Temporal.io
- **Database**: PostgreSQL with TypeORM
- **AI**: Google Gemini for cover letter generation
- **Testing**: Jest (Unit & E2E tests)

### Frontend
- **Framework**: React/Next.js with TypeScript
- **Styling**: Tailwind CSS / Material-UI
- **State Management**: Context API / Redux Toolkit

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Infrastructure**: Terraform (ready)
- **CI/CD**: GitHub Actions (ready)
- **Package Manager**: pnpm (workspace support)
- **Code Quality**: ESLint, Prettier, Husky

## Prerequisites

- Node.js 18+
- pnpm
- Docker & Docker Compose
- Google Gemini API key (optional, will use mock otherwise)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies and all workspace dependencies
pnpm install

# Or install all projects manually
pnpm run install:all
```

### 2. Environment Setup

```bash
cp .env .env.local
# Edit .env.local with your configuration
```

Required environment variables:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=job_assistant

# Temporal
TEMPORAL_ADDRESS=localhost:7233

# Gemini AI (optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Application
PORT=3000
DEFAULT_DEADLINE_WEEKS=4
GRACE_PERIOD_DAYS=7
```

### 3. Start Services with Docker

```bash
# Start PostgreSQL, Temporal, and related services
docker-compose up -d postgres temporal temporal-web

# Wait for services to be ready (about 30 seconds)
```

### 4. Run Database Migrations

```bash
# Run migrations from the backend directory
cd backend
pnpm run migration:run
cd ..
```

### 5. Start the Applications

```bash
# Start both backend and frontend in development mode
pnpm run start

# Or start them individually:
pnpm run start:backend    # Backend only
pnpm run start:frontend   # Frontend only
```

### 6. Start the Temporal Worker

```bash
# In another terminal, start the Temporal worker
cd backend
npx ts-node src/worker/temporal-worker.ts
```

### 7. Access the Applications

- **Frontend**: http://localhost:3000 (or 3001 if backend is on 3000)
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Temporal Web UI**: http://localhost:8080

## Development Commands

### Monorepo Commands (from root)

```bash
# Build all projects
pnpm run build

# Start all projects in development
pnpm run start

# Lint all projects
pnpm run lint

# Format all projects
pnpm run format

# Test all projects
pnpm run test
```

### Backend Commands

```bash
cd backend

# Development
pnpm run start:dev        # Start with hot reload
pnpm run start:debug      # Start in debug mode

# Building
pnpm run build            # Build for production
pnpm run start:prod       # Start production build

# Testing
pnpm run test             # Unit tests
pnpm run test:e2e         # E2E tests
pnpm run test:cov         # Test coverage
pnpm run test:watch       # Watch mode

# Database
pnpm run migration:generate -- src/migrations/MigrationName
pnpm run migration:run
pnpm run migration:revert

# Code Quality
pnpm run lint
pnpm run format
```

### Frontend Commands

```bash
cd frontend

# Development
pnpm run dev              # Start development server
pnpm run build            # Build for production
pnpm run start            # Start production build

# Testing
pnpm run test
pnpm run test:watch

# Code Quality
pnpm run lint
pnpm run format
```

## API Endpoints

### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Create new application |
| GET | `/api/applications` | List all applications |
| GET | `/api/applications?status=pending` | Filter by status |
| GET | `/api/applications/:id` | Get specific application |
| PATCH | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application |
| POST | `/api/applications/archive-expired` | Archive expired applications |

### Example: Create Application

```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "role": "Software Engineer",
    "jobDescription": "We are looking for a talented software engineer...",
    "resume": "Experienced software engineer with 5+ years...",
    "deadline": "2024-03-15T00:00:00.000Z"
  }'
```

## Project Structure

```
persona-job-assistant/
├── backend/                    # NestJS Backend Application
│   ├── src/
│   │   ├── applications/       # Application module
│   │   ├── workflow/          # Temporal workflows
│   │   ├── worker/            # Temporal workers
│   │   ├── llm/              # AI integration
│   │   ├── common/           # Shared utilities
│   │   └── main.ts           # Application entry point
│   ├── test/                 # Backend tests
│   ├── dist/                 # Compiled output
│   ├── package.json          # Backend dependencies
│   ├── tsconfig.json         # Backend TypeScript config
│   ├── nest-cli.json         # NestJS CLI config
│   └── jest.config.js        # Backend test config
├── frontend/                   # Frontend Application
│   ├── src/                  # Frontend source code
│   ├── public/               # Static assets
│   ├── package.json          # Frontend dependencies
│   └── ...                   # Frontend config files
├── temporal/                   # Temporal workflows & configs
├── docker-compose.yml          # Development services
├── Dockerfile                  # Backend container
├── package.json               # Root workspace config
├── tsconfig.json              # Root TypeScript config
└── README.md                  # This file
```

## Application Workflow

1. **Create Application**: Submit job details via frontend/API
2. **AI Processing**: Automatically generates cover letter using Google Gemini
3. **Temporal Workflow**: 
   - Sets up deadline monitoring
   - Schedules reminder notifications
   - Handles auto-archiving logic
4. **Status Updates**: Update status through frontend as you progress
5. **Deadline Management**: 
   - Reminder notifications at deadline
   - Grace period for status updates
   - Auto-archive if no response after grace period

## Deployment

### Using Docker

```bash
# Build backend image
docker build -t job-assistant-backend .

# Run with docker-compose
docker-compose up -d
```

### Environment-specific configurations

- **Development**: Uses `docker-compose.yml` for local services
- **Production**: Ready for Kubernetes deployment with Terraform configs
- **Testing**: Isolated test database and services

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 