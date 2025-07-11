# Use the official Temporal server image
FROM temporalio/server:1.24.2

# Install envsubst for environment variable substitution
RUN apt-get update && apt-get install -y gettext-base && rm -rf /var/lib/apt/lists/*

# Copy configuration files
COPY temporal/config.yaml /etc/temporal/config/config.yaml.template
COPY temporal/development-sql.yaml /etc/temporal/config/dynamicconfig/development-sql.yaml

# Create a startup script
RUN echo '#!/bin/bash' > /start-temporal.sh && \
    echo 'envsubst < /etc/temporal/config/config.yaml.template > /etc/temporal/config/config.yaml' >> /start-temporal.sh && \
    echo 'exec temporal-server --config /etc/temporal/config/config.yaml start' >> /start-temporal.sh && \
    chmod +x /start-temporal.sh

# Set environment variables with defaults
ENV TEMPORAL_ADDRESS=0.0.0.0:7233
ENV TEMPORAL_UI_ADDRESS=0.0.0.0:8080
ENV TEMPORAL_NAMESPACE=default
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_NAME=temporal
ENV DB_USER=temporal
ENV DB_PASSWORD=temporal

# Expose ports for Temporal server and UI
EXPOSE 7233 8080 9090

# Use the startup script
CMD ["/start-temporal.sh"] 