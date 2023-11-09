# Base Image
FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi8/nodejs-18:1-71.1697652955

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

# Entry point
CMD [ "npm", "run", "start:prod:load-test-gateway" ]