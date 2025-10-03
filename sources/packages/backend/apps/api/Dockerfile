# Base Image
FROM artifacts.developer.gov.bc.ca/docker-remote/node:24.9.0-alpine3.21

WORKDIR /app

# Application Port
ENV PORT 3000

# Copying root files to image workdir.
COPY /*.json /*.js ./

# Installing dependencies
RUN npm ci

# Copying sources.
COPY ./apps/api ./apps/api
COPY ./libs ./libs

# Building app
RUN npm run build api

# Exposing application port
EXPOSE ${PORT}

# Entry point
CMD [ "node", "--run", "start:prod:api" ]