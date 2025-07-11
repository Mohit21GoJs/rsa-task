output "backend_url" {
  description = "URL of the deployed backend service"
  value       = "https://${render_web_service.backend.url}"
}

output "frontend_url" {
  description = "URL of the deployed frontend service"
  value       = "https://${render_web_service.frontend.url}"
}

output "worker_name" {
  description = "Name of the deployed worker service"
  value       = render_background_worker.worker.name
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

output "worker_service_id" {
  description = "Render service ID for the worker"
  value       = render_background_worker.worker.id
}

output "database_id" {
  description = "Render database ID"
  value       = render_postgres.database.id
}

output "backend_env_group_id" {
  description = "Environment group ID for the backend service"
  value       = render_env_group.backend.id
}

output "frontend_env_group_id" {
  description = "Environment group ID for the frontend service"
  value       = render_env_group.frontend.id
}

output "worker_env_group_id" {
  description = "Environment group ID for the worker service"
  value       = render_env_group.worker.id
}

output "environment" {
  description = "Deployed environment name"
  value       = var.environment
} 