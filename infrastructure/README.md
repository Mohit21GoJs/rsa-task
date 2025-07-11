# Infrastructure Setup

This directory contains Terraform configuration for deploying the RSA Task application to Render.

## Prerequisites

### 1. Render Account Setup
- Create a Render account and obtain API credentials
- Set up the required environment variables for Terraform

### 2. Terraform Variables

Create a `terraform.tfvars` file with your specific values:

```hcl
# Render Configuration
render_api_key = "your-render-api-key"
render_owner_id = "your-render-owner-id"

# GitHub Configuration
github_access_token = "your-github-token"
# OR use GitHub App (recommended for production)
github_app_id = "your-github-app-id"
github_app_installation_id = "your-installation-id"
github_app_private_key = "your-private-key"

# Application Configuration
environment = "production"
gemini_api_key = "your-gemini-api-key"
temporal_namespace = "default"
allowed_origins = ["https://your-frontend-domain.com"]

# Resource Configuration
backend_plan = "starter"
frontend_plan = "starter"
worker_plan = "starter"
database_plan = "starter"

# Optional Configuration
grace_period_days = 7
default_deadline_weeks = 2
auto_deploy_enabled = true
github_branch = "main"
```

## Deployment Process

1. **Initialize Terraform**: `terraform init`
2. **Plan Deployment**: `terraform plan`
3. **Apply Configuration**: `terraform apply`

The Terraform configuration will automatically:
- Create all the required services
- Create environment groups with all necessary variables
- Link environment groups to their respective services
- Set up proper dependencies between services

## Environment Groups Created

The following environment groups are automatically created and managed by Terraform:

### 1. Backend Environment Group (`job-assistant-backend-env`)
- `NODE_ENV`: production/staging
- `PORT`: 3000
- `TEMPORAL_ADDRESS`: Automatically set to temporal service URL
- `TEMPORAL_NAMESPACE`: From variables
- `GEMINI_API_KEY`: From variables
- `GRACE_PERIOD_DAYS`: From variables
- `DEFAULT_DEADLINE_WEEKS`: From variables
- `DATABASE_NAME`: Automatically set to database name
- `CORS_ORIGINS`: From allowed_origins variable
- `TRUST_PROXY`: true
- `HELMET_ENABLED`: true
- `RATE_LIMIT_ENABLED`: Environment-dependent
- `LOG_LEVEL`: Environment-dependent
- `ENABLE_REQUEST_LOGGING`: true

### 2. Frontend Environment Group (`job-assistant-frontend-env`)
- `NODE_ENV`: production/staging
- `NEXT_PUBLIC_API_URL`: Automatically set to backend service URL
- `PORT`: 3000
- `NEXT_PUBLIC_APP_ENV`: From environment variable

### 3. Temporal Environment Group (`job-assistant-temporal-env`)
- `TEMPORAL_ADDRESS`: 0.0.0.0:7233
- `TEMPORAL_UI_ADDRESS`: 0.0.0.0:8080
- `DB`: postgresql
- `TEMPORAL_NAMESPACE`: From variables
- `TEMPORAL_LOG_LEVEL`: info
- `TEMPORAL_BIND_ON_IP`: 0.0.0.0
- `TEMPORAL_AUTO_SETUP`: true
- `TEMPORAL_VISIBILITY_AUTO_SETUP`: true

### 4. Worker Environment Group (`job-assistant-worker-env`)
- `NODE_ENV`: production/staging
- `TEMPORAL_ADDRESS`: Automatically set to temporal service URL
- `TEMPORAL_NAMESPACE`: From variables
- `GEMINI_API_KEY`: From variables
- `GRACE_PERIOD_DAYS`: From variables
- `DEFAULT_DEADLINE_WEEKS`: From variables
- `DATABASE_NAME`: Automatically set to database name
- `LOG_LEVEL`: Environment-dependent
- `ENABLE_REQUEST_LOGGING`: true

## Architecture

The infrastructure includes:
- **Backend API Service**: Node.js REST API
- **Frontend Service**: Next.js web application
- **Temporal Service**: Workflow orchestration
- **Worker Service**: Background job processing
- **PostgreSQL Database**: Data storage
- **Environment Groups**: Centralized environment variable management

## Environment Variables Management

This setup uses Render's Environment Groups feature through Terraform, which provides:
- **Fully automated setup**: No manual configuration required
- **Centralized management**: All variables managed in one place
- **Automatic linking**: Environment groups are automatically linked to services
- **Dynamic values**: Service URLs and database names are automatically populated
- **Version control**: Environment configuration is tracked in Git
- **Reproducible deployments**: Same configuration can be deployed to multiple environments

## Security Considerations

- All sensitive variables should be stored in `terraform.tfvars` (not committed to Git)
- Use GitHub App authentication for production deployments
- The configuration automatically enables security headers and rate limiting in production
- Regularly rotate API keys and secrets
- Consider using Terraform Cloud or similar for secure variable storage in CI/CD 