# Base Image
FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi8/nodejs-18:1-81

LABEL maintainer="BC GOV"

# Application Port
ENV PORT 3000
WORKDIR /opt/app-root/src

RUN whoami
RUN pwd
RUN ls -la

# Copying sources.
COPY ./apps/api ./apps/api
COPY ./libs ./libs
COPY ./apps/db-migrations ./apps/db-migrations

# Copying root files to image workdir.
COPY /*.json /*.js ./
RUN pwd
RUN ls -la
# Installing dependencies
RUN npm ci

# Building app
RUN npm run build api

# Exposing application port
EXPOSE ${PORT}

RUN mkdir /.npm

RUN chgrp -R 0 /.npm && \
    chmod -R g-u /.npm

# Entry point
CMD [ "npm", "run", "start:prod:api" ]