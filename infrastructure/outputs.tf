output "backend_url" {
  description = "URL of the deployed backend service"
  value       = "https://${render_web_service.backend.url}"
}

output "frontend_url" {
  description = "URL of the deployed frontend service"
  value       = "https://${render_web_service.frontend.url}"
}

output "temporal_url" {
  description = "URL of the deployed Temporal server"
  value       = "https://${render_web_service.temporal.url}"
}

output "worker_url" {
  description = "URL of the deployed worker service"
  value       = "https://${render_web_service.worker.url}"
}

output "database_connection_string" {
  description = "PostgreSQL database connection string"
  value       = render_postgres.database.connection_string
  sensitive   = true
}

output "database_host" {
  description = "PostgreSQL database host"
  value       = render_postgres.database.host
}

output "database_name" {
  description = "PostgreSQL database name"
  value       = render_postgres.database.database_name
}

output "backend_service_id" {
  description = "Render service ID for the backend"
  value       = render_web_service.backend.id
}

output "frontend_service_id" {
  description = "Render service ID for the frontend"
  value       = render_web_service.frontend.id
}

output "temporal_service_id" {
  description = "Render service ID for the Temporal server"
  value       = render_web_service.temporal.id
}

output "worker_service_id" {
  description = "Render service ID for the worker"
  value       = render_web_service.worker.id
}

output "database_id" {
  description = "Render database ID"
  value       = render_postgres.database.id
}

output "environment" {
  description = "Deployed environment name"
  value       = var.environment
} 