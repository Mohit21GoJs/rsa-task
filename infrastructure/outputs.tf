output "backend_url" {
  description = "URL of the deployed backend service"
  value       = "https://${render_web_service.backend.url}"
}

output "frontend_url" {
  description = "URL of the deployed frontend service"
  value       = "https://${render_web_service.frontend.url}"
}

output "backend_service_id" {
  description = "Render service ID for the backend"
  value       = render_web_service.backend.id
}

output "frontend_service_id" {
  description = "Render service ID for the frontend"
  value       = render_web_service.frontend.id
}

output "environment" {
  description = "Deployed environment name"
  value       = var.environment
} 