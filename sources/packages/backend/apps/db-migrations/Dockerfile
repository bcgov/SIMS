# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"
ENV NODE_ENV production

# Copying package.json and package-lock.json
COPY ../../package*.json ./

# Installing dependencies
RUN npm ci

# Copying sources
COPY . .

# Entry point
CMD [ "npm", "run", "migration:run" ]