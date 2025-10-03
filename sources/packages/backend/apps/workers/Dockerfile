# Base Image
FROM artifacts.developer.gov.bc.ca/docker-remote/node:24.9.0-alpine3.21

# Copying root files to image workdir.
COPY /*.json /*.js ./

# Installing dependencies
RUN npm ci

# Copying sources.
COPY ./apps/workers ./apps/workers
COPY ./libs ./libs

# Building app
RUN npm run build workers

# Entry point
CMD [ "node", "--run", "start:prod:workers" ]