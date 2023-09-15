# Base Image
FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

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