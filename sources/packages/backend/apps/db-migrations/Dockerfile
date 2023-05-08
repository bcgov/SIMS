# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

# Install packages, build and keep only prod packages
WORKDIR /app

LABEL maintainer="BC GOV"
ENV NODE_ENV production

# Copying package.json and package-lock.json
COPY package*.json ./

# Installing dependencies
RUN npm ci

# Copying sources
COPY . .

RUN set -x \
  && chmod -R 777 /app/

RUN apk add postgresql-client

# Entry point
CMD [ "npm", "run", "migration:run" ]