# Infrastructure Configuration

Terraform configuration for deploying the Job Application Assistant to Render.io.

## 📁 Files Overview

```
infrastructure/
├── main.tf              # Main infrastructure configuration
├── variables.tf         # Input variables
├── outputs.tf          # Output values
├── terraform.tfvars    # Variable values (create this)
└── README.md           # This file
```

## 🔧 Quick Setup

### 1. Create Configuration File

Create `terraform.tfvars`:

```hcl
# Render.io Configuration
render_api_key = "rnd_xxxxxxxxxxxxx"
render_owner_id = "usr_xxxxxxxxxxxxx"

# External Services
gemini_api_key = "AIzaxxxxxxxxxxxxxxxxx"
temporal_address = "your-external-temporal:7233"
temporal_namespace = "default"

# GitHub Integration
github_access_token = "github_pat_xxxxxxxxxxxxx"

# Environment
environment = "production"

# Service Plans (starter/standard/pro)
backend_plan = "starter"
frontend_plan = "starter"
database_plan = "starter"

# Scaling
backend_instances = 1
frontend_instances = 1
```

### 2. Initialize and Deploy

```bash
terraform init
terraform plan
terraform apply
```

## 🏗️ Infrastructure Components

### Services Created

| Service                | Purpose           | Configuration                 |
| ---------------------- | ----------------- | ----------------------------- |
| **Backend**            | NestJS API        | `render_web_service.backend`  |
| **Frontend**           | Next.js App       | `render_web_service.frontend` |
| **Database**           | PostgreSQL        | `render_postgres.database`    |
| **Environment Groups** | Config Management | `render_env_group.*`          |

### Service Configuration

```hcl
# Backend Service
resource "render_web_service" "backend" {
  name   = "job-assistant-backend"
  plan   = var.backend_plan
  region = var.region

  start_command = "pnpm run migration:run && cd backend && node dist/src/main.js"
  health_check_path = "/api/health"

  # Build configuration
  runtime_source = {
    native_runtime = {
      build_command = "pnpm install --frozen-lockfile && pnpm run build:backend"
      repo_url      = "https://github.com/Mohit21GoJs/rsa-task"
      runtime       = "node"
    }
  }
}
```

## 🔄 Environment Variables

### Backend Environment

- `NODE_ENV`: production/staging
- `PORT`: 3000
- `TEMPORAL_ADDRESS`: External Temporal cluster
- `TEMPORAL_NAMESPACE`: Configured namespace
- `GEMINI_API_KEY`: AI integration
- Database connection variables

### Frontend Environment

- `NODE_ENV`: production/staging
- `NEXT_PUBLIC_API_URL`: Backend service URL
- `PORT`: 3000

## 📊 Outputs

After deployment, access these outputs:

```bash
# Get service URLs
terraform output backend_url
terraform output frontend_url

# Get service IDs
terraform output backend_service_id
terraform output frontend_service_id
```

## 🔧 Customization

### Resource Plans

| Plan       | CPU      | Memory | Use Case         |
| ---------- | -------- | ------ | ---------------- |
| `starter`  | 0.5 vCPU | 512MB  | Development      |
| `standard` | 1 vCPU   | 1GB    | Small production |
| `pro`      | 2 vCPU   | 2GB    | Production       |

### Scaling Configuration

```hcl
# terraform.tfvars
backend_instances = 2    # Horizontal scaling
frontend_instances = 2

# Higher performance
backend_plan = "pro"
frontend_plan = "pro"
```

## 🔍 Monitoring

### Health Checks

Services include automatic health checks:

- Backend: `/api/health`
- Database connectivity validation
- Temporal worker status

### Logs and Metrics

Access through:

- Render Dashboard
- `terraform output` for service URLs
- Service logs in Render console

## 🚨 Troubleshooting

### Common Issues

**1. Authentication Errors**

```bash
# Verify API key
curl -H "Authorization: Bearer $RENDER_API_KEY" \
     https://api.render.com/v1/services
```

**2. Service Creation Fails**

- Check Render account limits
- Verify variable values
- Review Terraform logs

**3. Build Failures**

- Check GitHub repository access
- Verify build commands
- Review service logs

### Debug Commands

```bash
# Show current state
terraform show

# Check specific resource
terraform show render_web_service.backend

# Plan with detailed output
terraform plan -detailed-exitcode
```

## 📚 References

- [Render Terraform Provider](https://registry.terraform.io/providers/render-oss/render/latest)
- [Render.io Documentation](https://docs.render.com)
- [Main Deployment Guide](../docs/DEPLOYMENT.md)

---

**Quick Commands:**

```bash
# Apply changes
terraform apply

# Destroy infrastructure
terraform destroy

# Show outputs
terraform output
```
