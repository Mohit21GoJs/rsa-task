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
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
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
  database_name         = "${local.app_name}-db"
}

# Backend API Service
resource "render_web_service" "backend" {
  name   = local.backend_service_name
  plan   = var.backend_plan
  region = var.region

  start_command = "cd backend && node dist/main.js"

  # Health check configuration
  health_check_path = "/api/health"

  # Runtime source configuration with GitHub authentication
  runtime_source = {
    native_runtime = {
      auto_deploy   = var.auto_deploy_enabled
      branch        = var.github_branch
      build_command = "pnpm install --frozen-lockfile && pnpm run build:backend"
      repo_url      = var.github_repo_url
      runtime       = "node"
      
      # GitHub authentication for private repository access
      github_repo = var.github_access_token != "" ? {
        access_token = var.github_access_token
      } : var.github_app_id != "" ? {
        app_id           = var.github_app_id
        installation_id  = var.github_app_installation_id
        private_key      = var.github_app_private_key
      } : null
    }
  }

  # Resource limits
  num_instances = var.backend_instances

  # Disk configuration
  disk = {
    name       = "${local.backend_service_name}-disk"
    size_gb    = 1
    mount_path = "/data"
  }
}

# Frontend Service
resource "render_web_service" "frontend" {
  name   = local.frontend_service_name
  plan   = var.frontend_plan
  region = var.region

  start_command = "npm start"

  # Runtime source configuration with GitHub authentication
  runtime_source = {
    native_runtime = {
      auto_deploy    = var.auto_deploy_enabled
      branch         = var.github_branch
      build_command  = "cd .. && pnpm install --frozen-lockfile && pnpm run build:frontend"
      repo_url       = var.github_repo_url
      runtime        = "node"
      root_directory = "frontend"
      
      # GitHub authentication for private repository access
      github_repo = var.github_access_token != "" ? {
        access_token = var.github_access_token
      } : var.github_app_id != "" ? {
        app_id           = var.github_app_id
        installation_id  = var.github_app_installation_id
        private_key      = var.github_app_private_key
      } : null
    }
  }

  # Resource limits
  num_instances = var.frontend_instances
} 