# Infrastructure

This directory contains the Terraform configuration for deploying the Persona Job Assistant application to Render.io.

## Quick Start

1. **Prerequisites**
   ```bash
   # Install Terraform
   brew install terraform  # macOS
   # or download from https://terraform.io/downloads
   
   # Verify installation
   terraform version
   ```

2. **Setup AWS Backend**
   ```bash
   # Create S3 bucket for state
   aws s3 mb s3://persona-job-assistant-terraform-state
   
   # Create DynamoDB table for locking
   aws dynamodb create-table \
     --table-name terraform-state-lock \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
   ```

3. **Set Environment Variables**
   ```bash
   export RENDER_API_KEY="your_render_api_key"
   export GEMINI_API_KEY="your_gemini_api_key"
   export TF_STATE_BUCKET="persona-job-assistant-terraform-state"
   export AWS_REGION="us-east-1"
   ```

4. **Deploy**
   ```bash
   # From project root
   chmod +x scripts/deploy.sh
   
   # Deploy to staging
   ./scripts/deploy.sh staging plan
   ./scripts/deploy.sh staging apply
   
   # Deploy to production
   ./scripts/deploy.sh production plan
   ./scripts/deploy.sh production apply
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
| `RENDER_API_KEY` | Render.io API key | [Render Account Settings](https://dashboard.render.com/account) |
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |

## Resources Created

- **Web Services**: Frontend (Next.js) and Backend (NestJS)
- **Background Worker**: Temporal worker for job processing
- **Database**: PostgreSQL with automatic backups
- **Custom Domains**: Production only (optional)

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   ```

2. **State Lock Issues**
   ```bash
   # Force unlock (use carefully)
   terraform force-unlock <lock-id>
   ```

3. **Provider Issues**
   ```bash
   # Reinitialize providers
   terraform init -upgrade
   ```

For more detailed documentation, see [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md). 