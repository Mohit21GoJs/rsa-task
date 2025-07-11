#!/bin/bash

# Terraform deployment script for Render.io
# Usage: ./scripts/deploy-terraform.sh [plan|apply|destroy|output]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
INFRASTRUCTURE_DIR="$ROOT_DIR/infrastructure"

# Colors for output
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

# Help function
show_help() {
    cat << EOF
Terraform Deployment Script for Render.io

Usage: $0 [command]

COMMANDS:
    plan        Create and show deployment plan
    apply       Apply infrastructure changes (after plan)
    destroy     Destroy all infrastructure (use with caution)
    output      Show Terraform outputs (service URLs)
    validate    Validate Terraform configuration
    init        Initialize Terraform (first-time setup)

EXAMPLES:
    $0 plan     # See what will change
    $0 apply    # Deploy the changes
    $0 output   # Get service URLs

REQUIREMENTS:
    - Terraform >= 1.6.0
    - Terraform Cloud account configured
    - Required environment variables set

ENVIRONMENT VARIABLES:
    TF_VAR_render_api_key     - Render.io API key
    TF_VAR_gemini_api_key     - Google Gemini API key
    TF_VAR_temporal_address   - Temporal server address

EOF
}

# Check requirements
check_requirements() {
    log_info "Checking requirements..."
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is required but not installed"
        log_info "Install from: https://terraform.io/downloads"
        exit 1
    fi
    
    local tf_version=$(terraform version -json | jq -r '.terraform_version')
    log_info "Terraform version: $tf_version"
    
    # Check required environment variables
    if [[ -z "${TF_VAR_render_api_key:-}" ]]; then
        log_error "TF_VAR_render_api_key environment variable is required"
        log_info "Get your API key from: https://dashboard.render.com/account"
        exit 1
    fi
    
    if [[ -z "${TF_VAR_gemini_api_key:-}" ]]; then
        log_warning "TF_VAR_gemini_api_key not set - AI features will be disabled"
    fi
    
    if [[ -z "${TF_VAR_temporal_address:-}" ]]; then
        log_warning "TF_VAR_temporal_address not set - using default localhost:7233"
    fi
    
    log_success "Requirements check completed"
}

# Initialize Terraform
terraform_init() {
    log_info "Initializing Terraform..."
    cd "$INFRASTRUCTURE_DIR"
    
    terraform init
    
    log_success "Terraform initialized"
}

# Validate Terraform configuration
terraform_validate() {
    log_info "Validating Terraform configuration..."
    cd "$INFRASTRUCTURE_DIR"
    
    terraform fmt -check -recursive
    terraform validate
    
    log_success "Terraform configuration is valid"
}

# Create Terraform plan
terraform_plan() {
    log_info "Creating Terraform plan..."
    cd "$INFRASTRUCTURE_DIR"
    
    terraform plan -detailed-exitcode -out=tfplan
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_info "No changes required"
    elif [ $exit_code -eq 2 ]; then
        log_info "Changes detected - plan saved to tfplan"
        log_warning "Review the plan above before running 'apply'"
    else
        log_error "Plan failed with exit code $exit_code"
        exit 1
    fi
    
    log_success "Terraform plan completed"
}

# Apply Terraform changes
terraform_apply() {
    log_info "Applying Terraform changes..."
    cd "$INFRASTRUCTURE_DIR"
    
    local plan_file="tfplan"
    if [[ ! -f "$plan_file" ]]; then
        log_error "Plan file $plan_file not found. Run 'plan' first."
        exit 1
    fi
    
    # Confirmation
    log_warning "You are about to apply changes to PRODUCTION infrastructure"
    read -p "Are you sure? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log_info "Apply cancelled"
        exit 0
    fi
    
    terraform apply "$plan_file"
    
    log_success "Terraform changes applied successfully"
    log_info "Getting outputs..."
    terraform output
}

# Show Terraform outputs
terraform_output() {
    log_info "Showing Terraform outputs..."
    cd "$INFRASTRUCTURE_DIR"
    
    if terraform output backend_url &>/dev/null; then
        echo ""
        echo "🔗 Service URLs:"
        echo "Backend:  $(terraform output -raw backend_url)"
        echo "Frontend: $(terraform output -raw frontend_url)"
        echo ""
        echo "🗄️ Database: job-assistant-db"
        echo "🔧 Backend:  job-assistant-backend"
        echo "🎨 Frontend: job-assistant-frontend"
        echo "⚙️ Worker:   job-assistant-worker"
        echo ""
        echo "🔍 Monitor: https://dashboard.render.com"
    else
        log_warning "No outputs available. Infrastructure may not be deployed yet."
    fi
}

# Destroy infrastructure
terraform_destroy() {
    log_error "⚠️  DESTRUCTIVE OPERATION ⚠️"
    log_error "You are about to DESTROY all infrastructure"
    log_error "This action cannot be undone!"
    
    echo ""
    read -p "Type 'destroy production' to confirm: " confirm
    if [[ "$confirm" != "destroy production" ]]; then
        log_info "Destruction cancelled"
        exit 0
    fi
    
    cd "$INFRASTRUCTURE_DIR"
    terraform destroy
    
    log_success "Infrastructure destroyed"
}

# Main function
main() {
    local command=${1:-""}
    
    if [[ -z "$command" ]]; then
        show_help
        exit 1
    fi
    
    case "$command" in
        "plan")
            check_requirements
            terraform_plan
            ;;
        "apply")
            check_requirements
            terraform_apply
            ;;
        "destroy")
            check_requirements
            terraform_destroy
            ;;
        "output")
            terraform_output
            ;;
        "validate")
            check_requirements
            terraform_validate
            ;;
        "init")
            check_requirements
            terraform_init
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 