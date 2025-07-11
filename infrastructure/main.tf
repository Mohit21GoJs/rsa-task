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

  # Use Terraform Cloud for state management (simpler than S3)
  cloud {
    organization = "rsa-task"
    workspaces {
      name = "job-assistant-production"
    }
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
  app_name = "job-assistant"
  common_tags = {
    Application = local.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  
  # Service names with environment prefix
  backend_service_name  = "${local.app_name}-backend"
  frontend_service_name = "${local.app_name}-frontend"
  worker_service_name   = "${local.app_name}-worker"
  database_name        = "${local.app_name}-db"
}

# PostgreSQL Database
resource "render_postgres" "database" {
  name               = local.database_name
  plan               = var.database_plan
  region             = var.region
  version            = "15"
  
  # Production databases should have high availability
  high_availability_enabled = var.enable_high_availability
}

# Backend API Service
resource "render_web_service" "backend" {
  name         = local.backend_service_name
  runtime      = "node"
  plan         = var.backend_plan
  region       = var.region
  
  repo_url     = var.github_repo_url
  branch       = var.github_branch
  
  root_directory = "."
  
  build_command = "pnpm install --frozen-lockfile && pnpm run build:backend"
  start_command = "cd backend && node dist/main.js"
  
  # Health check configuration
  health_check_path = "/api/health"
  
  # Auto-deploy settings
  auto_deploy = var.auto_deploy_enabled
  
  # Environment variables
  env_vars = {
    NODE_ENV                = "production"
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
  num_instances = var.backend_instances
  
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
  plan         = var.frontend_plan
  region       = var.region
  
  repo_url     = var.github_repo_url
  branch       = var.github_branch
  
  root_directory = "frontend"
  
  build_command = "cd .. && pnpm install --frozen-lockfile && pnpm run build:frontend"
  start_command = "npm start"
  
  # Auto-deploy settings
  auto_deploy = var.auto_deploy_enabled
  
  # Environment variables
  env_vars = {
    NODE_ENV              = "production"
    NEXT_PUBLIC_API_URL   = "https://${render_web_service.backend.url}"
    PORT                  = "3000"
  }
  
  # Resource limits
  num_instances = var.frontend_instances
}

# Temporal Worker Service
resource "render_background_worker" "worker" {
  name         = local.worker_service_name
  runtime      = "node"
  plan         = var.worker_plan
  region       = var.region
  
  repo_url     = var.github_repo_url
  branch       = var.github_branch
  
  root_directory = "."
  
  build_command = "pnpm install --frozen-lockfile && pnpm run build:backend"
  start_command = "cd backend && node dist/worker/temporal-worker.js"
  
  # Auto-deploy settings
  auto_deploy = var.auto_deploy_enabled
  
  # Environment variables (shared with backend)
  env_vars = {
    NODE_ENV                = "production"
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
  num_instances = var.worker_instances
} 