# Base Image
FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi9/nodejs-22:9.5

LABEL maintainer="BC GOV"

# Copying root files to image workdir.
COPY /*.json /*.js ./

# Installing dependencies
RUN npm ci

# Copying sources.
COPY ./apps/load-test-gateway ./apps/load-test-gateway
COPY ./libs ./libs

# Building app
RUN npm run build load-test-gateway

# Grant access to group 0 to allow npm v9 to work
# See: https://docs.openshift.com/container-platform/4.11/openshift_images/create-images.html#use-uid_create-images
RUN chgrp -R 0 ./.npm && \
    chmod -R g=u ./.npm

# Entry point
CMD [ "npm", "run", "start:prod:load-test-gateway" ]