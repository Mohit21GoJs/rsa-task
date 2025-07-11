# Production Configuration for Job Assistant

# Core Configuration
github_repo_url     = "https://github.com/mohityadav/rsa-task"
github_branch       = "main"
region              = "oregon"
auto_deploy_enabled = true

# Service Plans - Start with cost-effective plans
backend_plan  = "starter"
frontend_plan = "starter"
worker_plan   = "starter"
database_plan = "starter"

# Instance Configuration - Start with single instances
backend_instances  = 1
frontend_instances = 1
worker_instances   = 1

# Feature Flags
enable_high_availability = false # Set to true for production workloads
enable_monitoring        = true

# Application Configuration
grace_period_days      = "7"
default_deadline_weeks = "4"

# Security Configuration
allowed_origins = ["*"] # Update with your actual domain
enable_ssl      = true

# Temporal Configuration
temporal_namespace = "default"

# Note: Sensitive variables (API keys) should be set via environment variables or Terraform Cloud 