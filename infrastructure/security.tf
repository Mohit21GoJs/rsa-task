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

# Custom domain configuration (if using custom domains)
resource "render_custom_domain" "backend_domain" {
  count = var.environment == "production" ? 1 : 0

  service_id = render_web_service.backend.id
  name       = "api.persona-job-assistant.com"
}

resource "render_custom_domain" "frontend_domain" {
  count = var.environment == "production" ? 1 : 0

  service_id = render_web_service.frontend.id
  name       = "persona-job-assistant.com"
}

# Environment variables with security considerations
locals {
  secure_backend_env_vars = merge(
    {
      NODE_ENV               = var.environment == "production" ? "production" : "staging"
      PORT                   = "3000"
      DATABASE_URL           = render_postgres.database.internal_connection_string
      TEMPORAL_ADDRESS       = var.temporal_address
      TEMPORAL_NAMESPACE     = var.temporal_namespace
      GEMINI_API_KEY         = var.gemini_api_key
      GRACE_PERIOD_DAYS      = var.grace_period_days
      DEFAULT_DEADLINE_WEEKS = var.default_deadline_weeks

      # Security settings
      CORS_ORIGINS       = join(",", var.allowed_origins)
      TRUST_PROXY        = "true"
      HELMET_ENABLED     = "true"
      RATE_LIMIT_ENABLED = var.environment == "production" ? "true" : "false"

      # Logging and monitoring
      LOG_LEVEL              = var.environment == "production" ? "info" : "debug"
      ENABLE_REQUEST_LOGGING = "true"
    },
    var.environment == "production" ? {
      # Production-only security settings
      SESSION_SECRET = "auto-generated-secure-secret"
      JWT_SECRET     = "auto-generated-jwt-secret"
      ENCRYPTION_KEY = "auto-generated-encryption-key"
    } : {}
  )

  secure_frontend_env_vars = {
    NODE_ENV            = var.environment == "production" ? "production" : "staging"
    NEXT_PUBLIC_API_URL = var.environment == "production" && length(render_custom_domain.backend_domain) > 0 ? "https://${render_custom_domain.backend_domain[0].name}" : "https://${render_web_service.backend.url}"
    PORT                = "3000"

    # Security settings
    NEXT_PUBLIC_APP_ENV = var.environment
  }
} 