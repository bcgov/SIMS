# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

# Copying root files to image workdir.
COPY /*.json /*.js ./

# Installing dependencies
RUN npm ci

# Copying sources.
COPY ./apps/workers ./apps/workers
COPY ./libs ./libs

# Building app
RUN npm run build workers

# Executing the image with a non-root user.
USER node

# Entry point
CMD [ "npm", "run", "start:prod:workers" ]