#!/bin/bash

# Deployment script for Persona Job Assistant
# Usage: ./scripts/deploy.sh [environment] [action]

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
Persona Job Assistant Deployment Script

Usage: $0 [environment] [action]

ENVIRONMENTS:
    staging     Deploy to staging environment
    production  Deploy to production environment

ACTIONS:
    plan        Create and show deployment plan
    apply       Apply infrastructure changes
    destroy     Destroy infrastructure (use with caution)
    validate    Validate Terraform configuration
    init        Initialize Terraform
    output      Show Terraform outputs

EXAMPLES:
    $0 staging plan     # Plan staging deployment
    $0 staging apply    # Deploy to staging
    $0 production plan  # Plan production deployment

REQUIREMENTS:
    - Terraform >= 1.6.0
    - Valid AWS credentials for S3 backend
    - Render API key in environment or secrets

EOF
}

# Validate requirements
check_requirements() {
    log_info "Checking requirements..."
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is required but not installed"
        exit 1
    fi
    
    local tf_version=$(terraform version -json | jq -r '.terraform_version')
    log_info "Terraform version: $tf_version"
    
    # Check required environment variables
    if [[ -z "${RENDER_API_KEY:-}" ]]; then
        log_warning "RENDER_API_KEY environment variable not set"
        log_info "Make sure to set this before applying changes"
    fi
    
    if [[ -z "${GEMINI_API_KEY:-}" ]]; then
        log_warning "GEMINI_API_KEY environment variable not set"
        log_info "Make sure to set this before applying changes"
    fi
    
    log_success "Requirements check completed"
}

# Initialize Terraform
terraform_init() {
    log_info "Initializing Terraform..."
    cd "$INFRASTRUCTURE_DIR"
    
    terraform init \
        -backend-config="bucket=${TF_STATE_BUCKET:-persona-job-assistant-terraform-state}" \
        -backend-config="region=${AWS_REGION:-us-east-1}"
    
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
    local environment=$1
    
    log_info "Creating Terraform plan for $environment..."
    cd "$INFRASTRUCTURE_DIR"
    
    local var_file="environments/${environment}.tfvars"
    if [[ ! -f "$var_file" ]]; then
        log_error "Environment file $var_file not found"
        exit 1
    fi
    
    terraform plan \
        -var-file="$var_file" \
        -var="render_api_key=${RENDER_API_KEY:-}" \
        -var="gemini_api_key=${GEMINI_API_KEY:-}" \
        -var="temporal_address=${TEMPORAL_ADDRESS:-temporal.temporal-system.svc.cluster.local:7233}" \
        -out="tfplan-${environment}"
    
    log_success "Terraform plan created: tfplan-${environment}"
}

# Apply Terraform changes
terraform_apply() {
    local environment=$1
    
    log_info "Applying Terraform changes for $environment..."
    cd "$INFRASTRUCTURE_DIR"
    
    local plan_file="tfplan-${environment}"
    if [[ ! -f "$plan_file" ]]; then
        log_error "Plan file $plan_file not found. Run 'plan' first."
        exit 1
    fi
    
    # Confirmation for production
    if [[ "$environment" == "production" ]]; then
        log_warning "You are about to apply changes to PRODUCTION environment"
        read -p "Are you sure? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
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
    terraform output
}

# Destroy infrastructure
terraform_destroy() {
    local environment=$1
    
    log_warning "⚠️  DESTRUCTIVE OPERATION ⚠️"
    log_warning "You are about to DESTROY $environment infrastructure"
    log_warning "This action cannot be undone!"
    
    read -p "Type 'destroy $environment' to confirm: " confirm
    if [[ "$confirm" != "destroy $environment" ]]; then
        log_info "Destruction cancelled"
        exit 0
    fi
    
    cd "$INFRASTRUCTURE_DIR"
    
    local var_file="environments/${environment}.tfvars"
    if [[ ! -f "$var_file" ]]; then
        log_error "Environment file $var_file not found"
        exit 1
    fi
    
    terraform destroy \
        -var-file="$var_file" \
        -var="render_api_key=${RENDER_API_KEY:-}" \
        -var="gemini_api_key=${GEMINI_API_KEY:-}" \
        -var="temporal_address=${TEMPORAL_ADDRESS:-temporal.temporal-system.svc.cluster.local:7233}"
    
    log_success "Infrastructure destroyed"
}

# Main function
main() {
    local environment=${1:-}
    local action=${2:-}
    
    # Show help if no arguments
    if [[ $# -eq 0 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    # Validate environment
    if [[ "$environment" != "staging" ]] && [[ "$environment" != "production" ]]; then
        log_error "Invalid environment: $environment"
        log_info "Valid environments: staging, production"
        exit 1
    fi
    
    # Validate action
    if [[ -z "$action" ]]; then
        log_error "Action is required"
        show_help
        exit 1
    fi
    
    # Check requirements
    check_requirements
    
    # Execute action
    case "$action" in
        "init")
            terraform_init
            ;;
        "validate")
            terraform_validate
            ;;
        "plan")
            terraform_init
            terraform_validate
            terraform_plan "$environment"
            ;;
        "apply")
            terraform_apply "$environment"
            ;;
        "output")
            terraform_output
            ;;
        "destroy")
            terraform_destroy "$environment"
            ;;
        *)
            log_error "Invalid action: $action"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 