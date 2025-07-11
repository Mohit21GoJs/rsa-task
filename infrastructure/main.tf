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
  database_name         = "${local.app_name}-db"
}

# Backend API Service
resource "render_web_service" "backend" {
  name   = local.backend_service_name
  plan   = var.backend_plan
  region = var.region

  start_command = "pnpm run migration:run && cd backend && node dist/src/main.js"

  # Health check configuration
  health_check_path = "/api/health"

  # Runtime source configuration with GitHub authentication
  runtime_source = {
    native_runtime = {
      auto_deploy   = var.auto_deploy_enabled
      branch        = var.github_branch
      build_command = "pnpm install --frozen-lockfile --prod=false && pnpm run build:backend"
      repo_url      = "https://github.com/Mohit21GoJs/rsa-task"
      runtime       = "node"

      # GitHub authentication for private repository access
      github_repo = var.github_access_token != "" ? {
        access_token = var.github_access_token
        } : var.github_app_id != "" ? {
        app_id          = var.github_app_id
        installation_id = var.github_app_installation_id
        private_key     = var.github_app_private_key
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

  start_command = "cd frontend && npm run start"

  # Runtime source configuration with GitHub authentication
  runtime_source = {
    native_runtime = {
      auto_deploy   = var.auto_deploy_enabled
      branch        = var.github_branch
      build_command = "pnpm install --frozen-lockfile --prod=false && pnpm run build:frontend"
      repo_url      = "https://github.com/Mohit21GoJs/rsa-task"
      runtime       = "node"

      # GitHub authentication for private repository access
      github_repo = var.github_access_token != "" ? {
        access_token = var.github_access_token
        } : var.github_app_id != "" ? {
        app_id          = var.github_app_id
        installation_id = var.github_app_installation_id
        private_key     = var.github_app_private_key
      } : null
    }
  }

  # Resource limits
  num_instances = var.frontend_instances
}

# Background Worker Service
resource "render_background_worker" "worker" {
  name   = "${local.app_name}-worker"
  plan   = var.worker_plan
  region = var.region

  start_command = "cd backend && node dist/src/worker/temporal-worker.js"

  # Runtime source configuration with GitHub authentication
  runtime_source = {
    native_runtime = {
      auto_deploy   = var.auto_deploy_enabled
      branch        = var.github_branch
      build_command = "pnpm install --frozen-lockfile --prod=false && pnpm run build:backend"
      repo_url      = "https://github.com/Mohit21GoJs/rsa-task"
      runtime       = "node"

      # GitHub authentication for private repository access
      github_repo = var.github_access_token != "" ? {
        access_token = var.github_access_token
        } : var.github_app_id != "" ? {
        app_id          = var.github_app_id
        installation_id = var.github_app_installation_id
        private_key     = var.github_app_private_key
      } : null
    }
  }

  # Resource limits
  num_instances = var.worker_instances

  # Disk configuration
  disk = {
    name       = "${local.app_name}-worker-disk"
    size_gb    = 1
    mount_path = "/data"
  }
}

# PostgreSQL Database
resource "render_postgres" "database" {
  name    = local.database_name
  plan    = var.database_plan
  region  = var.region
  version = "16"

  # Database configuration
  database_name = "job_assistant"
  database_user = "app_user"
}

# Environment Groups with Variables

# Backend Environment Group
resource "render_env_group" "backend" {
  name = "${local.backend_service_name}-env"

  env_vars = {
    NODE_ENV = {
      value = var.environment == "production" ? "production" : "staging"
    }
    PORT = {
      value = "3000"
    }
    TEMPORAL_NAMESPACE = {
      value = var.temporal_namespace
    }
    # Application settings
    GRACE_PERIOD_DAYS = {
      value = tostring(var.grace_period_days)
    }
    DEFAULT_DEADLINE_WEEKS = {
      value = tostring(var.default_deadline_weeks)
    }
    TRUST_PROXY = {
      value = "true"
    }
    HELMET_ENABLED = {
      value = "true"
    }
    RATE_LIMIT_ENABLED = {
      value = var.environment == "production" ? "true" : "false"
    }
    LOG_LEVEL = {
      value = var.environment == "production" ? "info" : "debug"
    }
    ENABLE_REQUEST_LOGGING = {
      value = "true"
    }
  }
}

# Frontend Environment Group
resource "render_env_group" "frontend" {
  name = "${local.frontend_service_name}-env"

  env_vars = {
    NODE_ENV = {
      value = var.environment == "production" ? "production" : "staging"
    }
    NEXT_PUBLIC_API_URL = {
      value = "${render_web_service.backend.url}/api"
    }
    PORT = {
      value = "3000"
    }
    NEXT_PUBLIC_APP_ENV = {
      value = var.environment
    }
    # Frontend specific settings
    NEXT_TELEMETRY_DISABLED = {
      value = "1"
    }
    HOSTNAME = {
      value = "0.0.0.0"
    }
  }
}

# Worker Environment Group
resource "render_env_group" "worker" {
  name = "${local.app_name}-worker-env"

  env_vars = {
    NODE_ENV = {
      value = var.environment == "production" ? "production" : "staging"
    }
    TEMPORAL_NAMESPACE = {
      value = var.temporal_namespace
    }
    # Application settings
    GRACE_PERIOD_DAYS = {
      value = tostring(var.grace_period_days)
    }
    DEFAULT_DEADLINE_WEEKS = {
      value = tostring(var.default_deadline_weeks)
    }
    LOG_LEVEL = {
      value = var.environment == "production" ? "info" : "debug"
    }
  }
}

# Environment Group Links
resource "render_env_group_link" "backend" {
  env_group_id = render_env_group.backend.id
  service_ids  = [render_web_service.backend.id]
}

resource "render_env_group_link" "frontend" {
  env_group_id = render_env_group.frontend.id
  service_ids  = [render_web_service.frontend.id]
}

resource "render_env_group_link" "worker" {
  env_group_id = render_env_group.worker.id
  service_ids  = [render_background_worker.worker.id]
} 