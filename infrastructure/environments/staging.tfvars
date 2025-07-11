environment = "staging"
region      = "oregon"

# Auto-deployment settings
auto_deploy_enabled = true

# Resource plans (cost-effective for staging)
backend_plan  = "starter"
frontend_plan = "starter"
worker_plan   = "starter"
database_plan = "starter"

# Feature flags
enable_high_availability = false
enable_auto_scaling      = false
enable_monitoring        = true

# Application settings
grace_period_days      = "3"
default_deadline_weeks = "2"

# Security settings
allowed_origins = ["http://localhost:3000", "https://*.onrender.com"]
enable_ssl      = true

# Backup settings
backup_retention_days = 3 