# Job Application Assistant - Infrastructure

This directory contains the Terraform configuration for deploying the Job Application Assistant to Render.io.

## 🏗️ Infrastructure Overview

The infrastructure deploys the following services:

- **🗄️ PostgreSQL Database** - Stores job applications and user data
- **🔧 Backend API** - NestJS API server with health checks
- **🎨 Frontend** - Next.js web application
- **⚙️ Background Worker** - Background job processing using external Temporal cluster

## 🔧 Configuration

### Required Variables

Set these in your `terraform.tfvars` file:

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
```

### Optional Variables

```hcl
# Environment
environment = "production"  # or "staging"

# Service Plans
backend_plan = "starter"
frontend_plan = "starter"
worker_plan = "starter"
database_plan = "starter"

# Scaling
backend_instances = 1
frontend_instances = 1
worker_instances = 1
```

## 🚀 Deployment

### Prerequisites

1. **Terraform Cloud Account**: Create account and workspace
2. **Render.io Account**: Get API key and owner ID
3. **External Temporal Cluster**: Set up your Temporal cluster
4. **GitHub Access Token**: For private repository deployment

### Local Deployment

```bash
# Initialize Terraform
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply
```

### CI/CD Deployment

The infrastructure is automatically deployed via GitHub Actions when changes are pushed to the main branch.

## 📊 Environment Groups

### 1. Backend Environment Group (`job-assistant-backend-env`)
- `NODE_ENV`: production/staging
- `PORT`: 3000
- `TEMPORAL_ADDRESS`: External Temporal server address
- `TEMPORAL_NAMESPACE`: From variables
- `GEMINI_API_KEY`: From variables
- `DATABASE_NAME`: From database resource

### 2. Frontend Environment Group (`job-assistant-frontend-env`)
- `NODE_ENV`: production/staging
- `NEXT_PUBLIC_API_URL`: Backend service URL
- `PORT`: 3000

### 3. Worker Environment Group (`job-assistant-worker-env`)
- `NODE_ENV`: production/staging
- `TEMPORAL_ADDRESS`: External Temporal server address
- `TEMPORAL_NAMESPACE`: From variables
- `GEMINI_API_KEY`: From variables
- `DATABASE_NAME`: From database resource

## 🔗 Outputs

After deployment, Terraform provides:

- **Service URLs**: Backend, frontend, and worker URLs
- **Service IDs**: Render service IDs for management
- **Environment Group IDs**: For configuration management

## 📋 Services

- **Database**: PostgreSQL database for application data
- **Backend Service**: NestJS API server
- **Frontend Service**: Next.js web application
- **Background Worker Service**: Background job processing with external Temporal

## 🔍 Monitoring

Monitor your services at:
- **Render Dashboard**: https://dashboard.render.com
- **Service Health**: Use the health check endpoints
- **External Temporal UI**: Check your Temporal cluster dashboard

## 🛠️ Troubleshooting

### Common Issues

1. **Service won't start**: Check environment variables and build logs
2. **Database connection errors**: Verify database credentials
3. **External Temporal connection**: Verify `TEMPORAL_ADDRESS` configuration
4. **Build failures**: Check package.json dependencies

### Health Checks

```bash
# Backend health
curl https://your-backend-url/api/health

# Database health
curl https://your-backend-url/api/health/db

# Background worker health
curl https://your-backend-url/api/health/worker
```

## 🔄 Scaling

To scale your services:

```hcl
# In terraform.tfvars
backend_instances = 2
frontend_instances = 2
worker_instances = 2

# Higher performance plans
backend_plan = "pro"
frontend_plan = "pro"
worker_plan = "pro"
```

## 🚨 Emergency Procedures

### Scale Down
```bash
terraform apply -var="backend_instances=1" -var="worker_instances=1"
```

### Destroy Infrastructure
```bash
terraform destroy
```

## 📚 Resources

- [Render.io Documentation](https://docs.render.com)
- [Terraform Provider for Render](https://registry.terraform.io/providers/render-oss/render/latest)
- [Temporal Documentation](https://docs.temporal.io) (for external cluster setup) 