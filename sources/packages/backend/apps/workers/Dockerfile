# Base Image
# dependabot: FROM node:25.6.1-alpine3.22
FROM artifacts.developer.gov.bc.ca/docker-remote/node:25.6.1-alpine3.22

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