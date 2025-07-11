terraform {
  required_version = ">= 1.6.0"
  
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  backend "s3" {
    # Configuration provided via CLI or environment variables
    key            = "terraform/state"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "render" {
  api_key = var.render_api_key
}

# Generate random suffix for unique naming
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  app_name = "persona-job-assistant"
  common_tags = {
    Application = local.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  
  # Service names with environment prefix
  backend_service_name  = "${var.environment}-${local.app_name}-backend"
  frontend_service_name = "${var.environment}-${local.app_name}-frontend"
  worker_service_name   = "${var.environment}-${local.app_name}-worker"
  database_name        = "${var.environment}-${local.app_name}-db"
}

# PostgreSQL Database
resource "render_postgres" "database" {
  name               = local.database_name
  plan               = var.environment == "production" ? "pro" : "starter"
  region             = var.region
  version            = "15"
  
  # Production databases should have high availability
  high_availability_enabled = var.environment == "production"
}

# Backend API Service
resource "render_web_service" "backend" {
  name         = local.backend_service_name
  runtime      = "node"
  plan         = var.environment == "production" ? "pro" : "starter"
  region       = var.region
  
  repo_url     = var.github_repo_url
  branch       = var.environment == "production" ? "main" : "develop"
  
  root_directory = "."
  
  build_command = "pnpm install --frozen-lockfile && pnpm run build:backend"
  start_command = "cd backend && node dist/main.js"
  
  # Health check configuration
  health_check_path = "/api/health"
  
  # Auto-deploy settings
  auto_deploy = var.auto_deploy_enabled
  
  # Environment variables
  env_vars = {
    NODE_ENV                = var.environment == "production" ? "production" : "staging"
    PORT                   = "3000"
    DATABASE_URL           = render_postgres.database.internal_connection_string
    DATABASE_HOST          = render_postgres.database.host
    DATABASE_PORT          = tostring(render_postgres.database.port)
    DATABASE_USERNAME      = render_postgres.database.user
    DATABASE_PASSWORD      = render_postgres.database.password
    DATABASE_NAME          = render_postgres.database.name
    TEMPORAL_ADDRESS       = var.temporal_address
    TEMPORAL_NAMESPACE     = var.temporal_namespace
    GEMINI_API_KEY        = var.gemini_api_key
    GRACE_PERIOD_DAYS     = var.grace_period_days
    DEFAULT_DEADLINE_WEEKS = var.default_deadline_weeks
  }
  
  # Resource limits
  num_instances = var.environment == "production" ? 2 : 1
  
  # Disk configuration
  disk = {
    name = "${local.backend_service_name}-disk"
    size_gb = 1
    mount_path = "/data"
  }
}

# Frontend Service
resource "render_web_service" "frontend" {
  name         = local.frontend_service_name
  runtime      = "node"
  plan         = var.environment == "production" ? "pro" : "starter"
  region       = var.region
  
  repo_url     = var.github_repo_url
  branch       = var.environment == "production" ? "main" : "develop"
  
  root_directory = "frontend"
  
  build_command = "cd .. && pnpm install --frozen-lockfile && pnpm run build:frontend"
  start_command = "cd frontend && npm start"
  
  # Auto-deploy settings
  auto_deploy = var.auto_deploy_enabled
  
  # Environment variables
  env_vars = {
    NODE_ENV              = var.environment == "production" ? "production" : "staging"
    NEXT_PUBLIC_API_URL   = "https://${render_web_service.backend.url}"
    PORT                  = "3000"
  }
  
  # Resource limits
  num_instances = var.environment == "production" ? 2 : 1
}

# Temporal Worker Service
resource "render_background_worker" "worker" {
  name         = local.worker_service_name
  runtime      = "node"
  plan         = var.environment == "production" ? "pro" : "starter"
  region       = var.region
  
  repo_url     = var.github_repo_url
  branch       = var.environment == "production" ? "main" : "develop"
  
  root_directory = "."
  
  build_command = "pnpm install --frozen-lockfile && pnpm run build:backend"
  start_command = "cd backend && node dist/worker/temporal-worker.js"
  
  # Auto-deploy settings
  auto_deploy = var.auto_deploy_enabled
  
  # Environment variables (shared with backend)
  env_vars = {
    NODE_ENV                = var.environment == "production" ? "production" : "staging"
    DATABASE_URL           = render_postgres.database.internal_connection_string
    DATABASE_HOST          = render_postgres.database.host
    DATABASE_PORT          = tostring(render_postgres.database.port)
    DATABASE_USERNAME      = render_postgres.database.user
    DATABASE_PASSWORD      = render_postgres.database.password
    DATABASE_NAME          = render_postgres.database.name
    TEMPORAL_ADDRESS       = var.temporal_address
    TEMPORAL_NAMESPACE     = var.temporal_namespace
    GEMINI_API_KEY        = var.gemini_api_key
    GRACE_PERIOD_DAYS     = var.grace_period_days
    DEFAULT_DEADLINE_WEEKS = var.default_deadline_weeks
  }
  
  # Resource limits
  num_instances = var.environment == "production" ? 2 : 1
} 