# Use the official Temporal auto-setup image which handles DB initialization
FROM temporalio/auto-setup:1.24.2

# Set environment variables that will be overridden by Render
ENV TEMPORAL_ADDRESS=0.0.0.0:7233
ENV TEMPORAL_UI_ADDRESS=0.0.0.0:8080
ENV TEMPORAL_NAMESPACE=default

# Expose ports for Temporal server and UI
EXPOSE 7233 8080

# The auto-setup image will handle database initialization and setup
# It reads environment variables for database configuration
CMD ["temporal-server", "start"] 