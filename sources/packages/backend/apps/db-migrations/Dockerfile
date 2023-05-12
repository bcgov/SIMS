# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

# Copying package.json and package-lock.json
COPY ./package*.json ./

# Installing dependencies
RUN npm ci --ignore-scripts

# Copying sources
COPY ./apps/db-migrations ./apps/db-migrations
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY env-setup.js ./


# Building app
RUN npm run build db-migrations

RUN addgroup -S nonroot \
  && adduser -S nonroot -G nonroot

USER nonroot

# Entry point
CMD [ "npm", "run", "start:prod:db-migrations" ]