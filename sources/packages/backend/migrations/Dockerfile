# Base Image
# Artifactory registry is passed as a build argument to avoid hardcoding it in the Dockerfile.
# The default value (docker.io) allows dependabot to resolve and update the base image when an update is available.
ARG DOCKER_REGISTRY=docker.io
FROM ${DOCKER_REGISTRY}/node:25.9.0-alpine3.22

ENV npm_config_cache=/app/.npm

WORKDIR /app

# Copying backend package.json and package-lock.json
COPY backend/package*.json ./

# Copying forms package.json and package-lock.json
COPY forms/package*.json ./forms/

# Installing backend and forms dependencies
RUN npm ci --ignore-scripts && \
    cd forms && npm ci --ignore-scripts

# Copying backend sources
COPY backend/apps/db-migrations ./apps/db-migrations
COPY backend/tsconfig.json ./
COPY backend/tsconfig.build.json ./
COPY backend/env-setup.js ./

# Copying camunda sources
COPY backend/workflow/src/deploy.models.ts ./workflow/src/
COPY backend/workflow/src/deploy.ts ./workflow/src/
COPY backend/workflow/src/workflow-definitions ./workflow/src/workflow-definitions

# Copying forms sources
COPY forms/src ./forms/src
COPY forms/tsconfig.json ./forms/
COPY forms/tsconfig.build.json ./forms/

# Fixing permissions for OpenShift because it runs containers with a random user ID.
# See: https://docs.openshift.com/container-platform/4.11/openshift_images/create-images.html#use-uid_create-images
RUN chgrp -R 0 ./.npm && \
    chmod -R g=u ./.npm

# Entry point
CMD ["sh", "-c", "echo 'Migration container started.' && tail -f /dev/null"]
