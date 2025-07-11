# Security Configuration for Render Services

# Environment variable validation and security
locals {
  # Validate sensitive environment variables are provided
  required_secrets = {
    render_api_key = var.render_api_key
    gemini_api_key = var.gemini_api_key
  }

  # Security headers for web services
  security_headers = {
    "X-Frame-Options"           = "DENY"
    "X-Content-Type-Options"    = "nosniff"
    "X-XSS-Protection"          = "1; mode=block"
    "Strict-Transport-Security" = "max-age=31536000; includeSubDomains"
    "Content-Security-Policy"   = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    "Referrer-Policy"           = "strict-origin-when-cross-origin"
  }
}

# Validate required secrets are not empty
resource "terraform_data" "validate_secrets" {
  for_each = local.required_secrets

  lifecycle {
    precondition {
      condition     = length(trimspace(each.value)) > 0
      error_message = "Secret '${each.key}' cannot be empty."
    }
  }
} 