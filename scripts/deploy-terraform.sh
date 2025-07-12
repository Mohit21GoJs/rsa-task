#!/bin/bash
# Terraform deployment script for Render.io infrastructure

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
  log_error "Terraform is not installed. Please install Terraform first."
  exit 1
fi

# Check if we're in the correct directory
if [[ ! -f "infrastructure/main.tf" ]]; then
  log_error "Please run this script from the project root directory."
  exit 1
fi

# Change to infrastructure directory
cd infrastructure

# Check required environment variables
log_info "Checking required environment variables..."

required_vars=(
  "TF_VAR_render_api_key"
  "TF_VAR_render_owner_id"
  "TF_VAR_gemini_api_key"
  "TF_VAR_github_access_token"
)

# Documentation for required variables
log_info "Required environment variables:"
cat << EOF
TF_VAR_render_api_key       - Render.io API key
TF_VAR_render_owner_id      - Render.io owner ID
TF_VAR_gemini_api_key       - Google Gemini API key
TF_VAR_github_access_token  - GitHub access token for private repos
TF_VAR_temporal_address     - External Temporal server address
TF_VAR_temporal_namespace   - Temporal namespace (optional)
TF_VAR_environment          - Environment name (optional)
TF_VAR_github_branch        - GitHub branch to deploy (optional)
EOF

missing_vars=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing_vars+=("$var")
  fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
  log_error "Missing required environment variables:"
  for var in "${missing_vars[@]}"; do
    echo "  - $var"
  done
  exit 1
fi

# Optional variables with defaults
if [[ -z "${TF_VAR_environment:-}" ]]; then
  export TF_VAR_environment="production"
  log_info "TF_VAR_environment not set - using default: production"
fi

if [[ -z "${TF_VAR_github_branch:-}" ]]; then
  export TF_VAR_github_branch="main"
  log_info "TF_VAR_github_branch not set - using default: main"
fi

if [[ -z "${TF_VAR_temporal_address:-}" ]]; then
  log_warning "TF_VAR_temporal_address not set - using default localhost:7233"
  export TF_VAR_temporal_address="localhost:7233"
fi

if [[ -z "${TF_VAR_temporal_namespace:-}" ]]; then
  export TF_VAR_temporal_namespace="default"
  log_info "TF_VAR_temporal_namespace not set - using default: default"
fi

# Initialize Terraform
log_info "Initializing Terraform..."
terraform init

# Validate configuration
log_info "Validating Terraform configuration..."
terraform validate

# Plan deployment
log_info "Planning deployment..."
terraform plan -out=tfplan

# Ask for confirmation
echo ""
read -p "Do you want to apply this plan? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Apply the plan
  log_info "Applying Terraform plan..."
  terraform apply tfplan
  
  # Clean up plan file
  rm -f tfplan
  
  log_success "Deployment completed successfully!"
  
  # Show outputs
  log_info "Deployment outputs:"
  terraform output
else
  log_info "Deployment cancelled."
  rm -f tfplan
fi 