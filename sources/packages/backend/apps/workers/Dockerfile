# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

# Copying package.json and package-lock.json
COPY package*.json ./

# Installing dependencies
RUN npm ci --ignore-scripts

# Copying sources
COPY apps/workers ./apps/workers
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY env-setup.js ./

# Building app
RUN npm run build workers

# Set the non-root user
USER node

# Entry point
CMD [ "npm", "run", "start:prod:workers" ]