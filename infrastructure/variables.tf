# Core Configuration
variable "render_api_key" {
  description = "Render.com API key for managing services"
  type        = string
  sensitive   = true
}

variable "render_owner_id" {
  description = "Render.com Owner id for managing services"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., development, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition = contains([
      "development", "staging", "production"
    ], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "github_repo_url" {
  description = "GitHub repository URL for the application"
  type        = string
  default     = "https://github.com/mohit21gojs/rsa-task"
}

variable "github_branch" {
  description = "GitHub branch to deploy from"
  type        = string
  default     = "main"
}

# GitHub Authentication for Private Repository Access
variable "github_access_token" {
  description = "GitHub personal access token or fine-grained token for private repository access"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_app_id" {
  description = "GitHub App ID for private repository access (alternative to access token)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_app_installation_id" {
  description = "GitHub App Installation ID for private repository access"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_app_private_key" {
  description = "GitHub App private key for authentication"
  type        = string
  sensitive   = true
  default     = ""
}

variable "region" {
  description = "Render region for service deployment"
  type        = string
  default     = "oregon"

  validation {
    condition = contains([
      "oregon", "ohio", "virginia", "frankfurt", "singapore"
    ], var.region)
    error_message = "Region must be one of: oregon, ohio, virginia, frankfurt, singapore."
  }
}

variable "auto_deploy_enabled" {
  description = "Enable automatic deployment on code changes"
  type        = bool
  default     = true
}

# Service Plans Configuration
variable "backend_plan" {
  description = "Render plan for backend service"
  type        = string
  default     = "starter"

  validation {
    condition = contains([
      "free", "starter", "standard", "pro", "pro-plus"
    ], var.backend_plan)
    error_message = "Backend plan must be one of: free, starter, standard, pro, pro-plus."
  }
}

variable "frontend_plan" {
  description = "Render plan for frontend service"
  type        = string
  default     = "starter"

  validation {
    condition = contains([
      "free", "starter", "standard", "pro", "pro-plus"
    ], var.frontend_plan)
    error_message = "Frontend plan must be one of: free, starter, standard, pro, pro-plus."
  }
}

variable "worker_plan" {
  description = "Render plan for worker service"
  type        = string
  default     = "starter"

  validation {
    condition = contains([
      "free", "starter", "standard", "pro", "pro-plus"
    ], var.worker_plan)
    error_message = "Worker plan must be one of: free, starter, standard, pro, pro-plus."
  }
}

variable "database_plan" {
  description = "Render plan for PostgreSQL database"
  type        = string
  default     = "basic-256mb"

  validation {
    condition = contains([
      "basic-256mb", "basic-1gb"
    ], var.database_plan)
    error_message = "Database plan must be one of: basic-1gb, basic-256mb."
  }
}

# Instance Configuration
variable "backend_instances" {
  description = "Number of backend service instances"
  type        = number
  default     = 1

  validation {
    condition     = var.backend_instances >= 1 && var.backend_instances <= 10
    error_message = "Backend instances must be between 1 and 10."
  }
}

variable "frontend_instances" {
  description = "Number of frontend service instances"
  type        = number
  default     = 1

  validation {
    condition     = var.frontend_instances >= 1 && var.frontend_instances <= 10
    error_message = "Frontend instances must be between 1 and 10."
  }
}

variable "worker_instances" {
  description = "Number of worker service instances"
  type        = number
  default     = 1

  validation {
    condition     = var.worker_instances >= 1 && var.worker_instances <= 5
    error_message = "Worker instances must be between 1 and 5."
  }
}

# Temporal Configuration
variable "temporal_address" {
  description = "Temporal server address"
  type        = string
  default     = "temporal.temporal-system.svc.cluster.local:7233"
}

variable "temporal_namespace" {
  description = "Temporal namespace"
  type        = string
  default     = "default"
}

# AI Configuration
variable "gemini_api_key" {
  description = "Google Gemini API key for AI-powered features"
  type        = string
  sensitive   = true
}

# Application Configuration
variable "grace_period_days" {
  description = "Grace period in days for job application deadlines"
  type        = string
  default     = "7"
}

variable "default_deadline_weeks" {
  description = "Default deadline in weeks for job applications"
  type        = string
  default     = "4"
}

# Feature Flags
variable "enable_high_availability" {
  description = "Enable high availability features"
  type        = bool
  default     = false
}

variable "enable_monitoring" {
  description = "Enable monitoring and alerting for services"
  type        = bool
  default     = true
}

# Security Configuration
variable "allowed_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "enable_ssl" {
  description = "Enable SSL/TLS for all services"
  type        = bool
  default     = true
} 