# Base Image
# dependabot: FROM node:25.6.1-alpine3.22
FROM artifacts.developer.gov.bc.ca/docker-remote/node:25.6.1-alpine3.22

ENV npm_config_cache=/app/.npm

WORKDIR /app

# Copying backend package.json and package-lock.json
COPY backend/package*.json ./

# Copying forms package.json and package-lock.json
COPY forms/package*.json ./forms/

# Installing backend dependencies
RUN npm ci --ignore-scripts

# Installing forms dependencies
RUN cd forms && npm ci --ignore-scripts

# Copying backend sources
COPY backend/apps/db-migrations ./apps/db-migrations
COPY backend/tsconfig.json ./
COPY backend/tsconfig.build.json ./
COPY backend/env-setup.js ./

# Copying forms sources
COPY forms/src ./forms/src
COPY backend/tsconfig.json ./forms/
COPY backend/tsconfig.build.json ./forms/

# Fixing permissions for OpenShift because it runs containers with a random user ID.
# See: https://docs.openshift.com/container-platform/4.11/openshift_images/create-images.html#use-uid_create-images
RUN chgrp -R 0 ./.npm && \
    chmod -R g=u ./.npm

# Entry point
CMD ["sh", "-c", "echo 'Migration container started.' && tail -f /dev/null"]
