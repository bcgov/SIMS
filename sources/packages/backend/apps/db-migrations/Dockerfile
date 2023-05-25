# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

# Copying package.json and package-lock.json
COPY package*.json ./

# Installing dependencies
RUN npm ci --ignore-scripts

# Copying sources
COPY apps/db-migrations ./apps/db-migrations
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY env-setup.js ./

# Set the non-root user
USER 1001

# Entry point
CMD [ "npm", "run", "start:prod:db-migrations" ]
