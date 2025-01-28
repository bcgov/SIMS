# Base Image
FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi9/nodejs-22:9.5

LABEL maintainer="BC GOV"

# Application Port
ENV PORT 3000

# Copying root files to image workdir.
COPY /*.json /*.js ./

# Installing dependencies
RUN npm ci

# Copying sources.
COPY ./apps/api ./apps/api
COPY ./libs ./libs
COPY ./apps/db-migrations ./apps/db-migrations

# Building app
RUN npm run build api

# Exposing application port
EXPOSE ${PORT}

# Grant access to group 0 to allow npm v9 to work
# See: https://docs.openshift.com/container-platform/4.11/openshift_images/create-images.html#use-uid_create-images
RUN chgrp -R 0 ./.npm && \
    chmod -R g=u ./.npm

# Entry point
CMD [ "npm", "run", "start:prod:api" ]