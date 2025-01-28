# Base Image
FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi9/nodejs-22:9.5

LABEL maintainer="BC GOV"

# Copying package.json and package-lock.json
COPY package*.json ./

# Installing dependencies
RUN npm ci --ignore-scripts

# Copying sources
COPY apps/db-migrations ./apps/db-migrations
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY env-setup.js ./

# Grant access to group 0 to allow npm v9 to work
# See: https://docs.openshift.com/container-platform/4.11/openshift_images/create-images.html#use-uid_create-images
RUN chgrp -R 0 ./.npm && \
    chmod -R g=u ./.npm

# Entry point
CMD [ "npm", "run", "start:prod:db-migrations" ]
