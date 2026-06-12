# Base Image
# Artifactory registry is passed as a build argument to avoid hardcoding it in the Dockerfile.
# The default value (docker.io) allows dependabot to resolve and update the base image when an update is available.
ARG DOCKER_REGISTRY=docker.io
FROM ${DOCKER_REGISTRY}/node:26.3.0-alpine3.24

ENV npm_config_cache=/app/.npm

WORKDIR /app

# Copying root files to image workdir.
COPY /*.json /*.js ./

# Installing dependencies
RUN npm ci

# Copying sources.
COPY ./apps/workers ./apps/workers
COPY ./libs ./libs

# Building app
RUN npm run build workers

# Fixing permissions for OpenShift because it runs containers with a random user ID.
# See: https://docs.openshift.com/container-platform/4.11/openshift_images/create-images.html#use-uid_create-images
RUN chgrp -R 0 ./.npm && \
    chmod -R g=u ./.npm

# Entry point
CMD [ "npm", "run", "start:prod:workers" ]