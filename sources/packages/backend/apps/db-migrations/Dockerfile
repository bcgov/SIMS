# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

RUN addgroup -S nonroot \
  && adduser -S nonroot -G nonroot

USER nonroot

LABEL maintainer="BC GOV"

# Copying package.json and package-lock.json
COPY ./package*.json ./

# Installing dependencies
RUN npm ci --ignore-scripts

# Copying sources
COPY ./apps/db-migrations ./apps/db-migrations

# Building app
RUN npm run build db-migrations

# Entry point
CMD [ "npm", "run", "start:prod:db-migrations" ]