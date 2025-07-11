# Infrastructure

This directory contains the Terraform configuration for deploying the Job Application Assistant to Render.io using **Terraform Cloud** for state management.

## Quick Start

1. **Prerequisites**
   ```bash
   # Install Terraform
   brew install terraform  # macOS
   # or download from https://terraform.io/downloads
   
   # Verify installation
   terraform version
   ```

2. **Setup Terraform Cloud**
   ```bash
   # Create account at https://cloud.hashicorp.com/products/terraform
   # Create organization (e.g., "rsa-task")  
   # Create workspace named "job-assistant-production"
   # Generate API token: Settings → API Tokens → Create API Token
   ```

3. **Set Environment Variables**
   ```bash
   export TF_API_TOKEN="your_terraform_cloud_token"
   export RENDER_API_KEY="your_render_api_key"
   export GEMINI_API_KEY="your_gemini_api_key"
   export TEMPORAL_ADDRESS="your_temporal_endpoint:7233"
   ```

4. **Deploy**
   ```bash
   # Navigate to infrastructure directory
   cd infrastructure
   
   # Initialize (one-time setup)
   terraform init
   
   # Plan changes
   terraform plan
   
   # Apply changes
   terraform apply
   ```

## File Structure

```
infrastructure/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Variable definitions
├── outputs.tf              # Output definitions
├── security.tf             # Security configurations
├── .terraform.lock.hcl     # Provider version lock
├── environments/
│   ├── staging.tfvars      # Staging environment variables
│   └── production.tfvars   # Production environment variables
└── README.md               # This file
```

## Environments

### Staging
- **URL**: Auto-generated Render URLs
- **Resources**: Starter plans
- **Auto-deploy**: Enabled
- **Cost**: ~$21/month

### Production
- **URL**: Custom domains (optional)
- **Resources**: Pro plans with HA
- **Auto-deploy**: Disabled
- **Cost**: ~$175/month

## Manual Commands

```bash
# Initialize
terraform init

# Plan changes
terraform plan -var-file="environments/staging.tfvars"

# Apply changes
terraform apply

# Show outputs
terraform output

# Destroy (careful!)
terraform destroy -var-file="environments/staging.tfvars"
```

## Required Secrets

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `TF_API_TOKEN` | Terraform Cloud API token | [Terraform Cloud Settings](https://app.terraform.io/app/settings/tokens) |
| `RENDER_API_KEY` | Render.io API key | [Render Account Settings](https://dashboard.render.com/account) |
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `TEMPORAL_ADDRESS` | Temporal server endpoint | Your Temporal cluster or `localhost:7233` |

## Resources Created

- **Web Services**: Frontend (Next.js) and Backend (NestJS)
- **Background Worker**: Temporal worker for job processing
- **Database**: PostgreSQL with automatic backups
- **Custom Domains**: Production only (optional)

## Troubleshooting

### Common Issues

1. **Terraform Cloud Authentication**
   ```bash
   # Check if logged in to Terraform Cloud
   terraform login
   ```

2. **Render API Issues**
   ```bash
   # Test Render API key
   curl -H "Authorization: Bearer $RENDER_API_KEY" \
        https://api.render.com/v1/services
   ```

3. **Provider Issues**
   ```bash
   # Reinitialize providers
   terraform init -upgrade
   ```

For more detailed documentation, see [../DEPLOY.md](../DEPLOY.md). 