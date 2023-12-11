# Base Image
FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi8/nodejs-18:1-81

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

# Executing the image with a non-root user.
USER 1001

# Entry point
CMD [ "npm", "run", "start:prod:api" ]