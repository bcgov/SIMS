# Base Image
FROM artifacts.developer.gov.bc.ca/docker-remote/node:24.9.0-alpine3.21

WORKDIR /app

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
CMD [ "node", "--run", "start:prod:load-test-gateway" ]