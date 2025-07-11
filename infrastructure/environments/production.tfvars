environment = "production"
region      = "oregon"

# Auto-deployment settings (disabled for production safety)
auto_deploy_enabled = false

# Resource plans (robust for production)
backend_plan  = "pro"
frontend_plan = "pro"
worker_plan   = "pro"
database_plan = "pro"

# Feature flags
enable_high_availability = true
enable_auto_scaling      = true
enable_monitoring        = true

# Application settings
grace_period_days      = "7"
default_deadline_weeks = "4"

# Security settings
allowed_origins = ["https://persona-job-assistant.com"]
enable_ssl      = true

# Backup settings
backup_retention_days = 30 