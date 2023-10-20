# Base Image
FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi8/nodejs-18:1-71.1696531182

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

# Entry point
CMD [ "npm", "run", "start:prod:api" ]