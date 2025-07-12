FROM temporalio/auto-setup:1.18.3

USER root

# Copy dynamic configuration
COPY dynamicconfig.yaml /etc/temporal/dynamicconfig.yaml

# Copy server configuration
COPY development.yaml /etc/temporal/config/development.yaml

# Copy custom auto-setup script
COPY auto-setup.sh /auto-setup.sh

# Make the script executable
RUN chmod +x /auto-setup.sh

# Override the default entrypoint to use our custom script
ENTRYPOINT ["/auto-setup.sh"] 