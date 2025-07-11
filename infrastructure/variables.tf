variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "render_api_key" {
  description = "Render.com API key for managing services"
  type        = string
  sensitive   = true
}

variable "github_repo_url" {
  description = "GitHub repository URL for the application"
  type        = string
  default     = "https://github.com/mohityadav/persona-job-assistant"
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

# Database Configuration
variable "database_url" {
  description = "PostgreSQL database URL (used for external databases)"
  type        = string
  default     = ""
  sensitive   = true
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

# Resource Configuration
variable "backend_plan" {
  description = "Render plan for backend service"
  type        = string
  default     = null # Will be determined by environment
  
  validation {
    condition = var.backend_plan == null || contains([
      "starter", "standard", "pro", "pro-plus"
    ], var.backend_plan)
    error_message = "Backend plan must be one of: starter, standard, pro, pro-plus."
  }
}

variable "frontend_plan" {
  description = "Render plan for frontend service"
  type        = string
  default     = null # Will be determined by environment
  
  validation {
    condition = var.frontend_plan == null || contains([
      "starter", "standard", "pro", "pro-plus"
    ], var.frontend_plan)
    error_message = "Frontend plan must be one of: starter, standard, pro, pro-plus."
  }
}

variable "worker_plan" {
  description = "Render plan for worker service"
  type        = string
  default     = null # Will be determined by environment
  
  validation {
    condition = var.worker_plan == null || contains([
      "starter", "standard", "pro", "pro-plus"
    ], var.worker_plan)
    error_message = "Worker plan must be one of: starter, standard, pro, pro-plus."
  }
}

variable "database_plan" {
  description = "Render plan for PostgreSQL database"
  type        = string
  default     = null # Will be determined by environment
  
  validation {
    condition = var.database_plan == null || contains([
      "starter", "standard", "pro", "pro-plus"
    ], var.database_plan)
    error_message = "Database plan must be one of: starter, standard, pro, pro-plus."
  }
}

# Monitoring and Alerting
variable "enable_monitoring" {
  description = "Enable monitoring and alerting for services"
  type        = bool
  default     = true
}

variable "notification_email" {
  description = "Email address for notifications and alerts"
  type        = string
  default     = ""
}

# Feature Flags
variable "enable_high_availability" {
  description = "Enable high availability features (production only)"
  type        = bool
  default     = false
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for services"
  type        = bool
  default     = false
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

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
  
  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 30
    error_message = "Backup retention days must be between 1 and 30."
  }
} 