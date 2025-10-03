# Base Image
FROM artifacts.developer.gov.bc.ca/docker-remote/node:24.9.0-alpine3.21

WORKDIR /app

# Copying root files to image workdir.
COPY /*.json /*.js ./

# Installing dependencies
RUN npm ci

# Copying sources.
COPY ./apps/queue-consumers ./apps/queue-consumers
COPY ./libs ./libs

# Building app
RUN npm run build queue-consumers

# Entry point
CMD [ "npm", "run", "start:prod:queue-consumers" ]