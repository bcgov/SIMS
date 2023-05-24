# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

# Copying root files to image workdir.
COPY /*.json /*.js ./

# Installing dependencies
RUN npm ci

# Copying sources.
COPY ./apps/workers ./apps/workers
COPY ./apps/db-migrations ./apps/db-migrations
COPY ./libs ./libs

# Building app
RUN npm run build workers

# Ensure that the non-root user will be able to write the coverage report.
RUN mkdir -p /app/apps/workers/coverage/ && chown node /app/apps/workers/coverage/

# Executing the image with a non-root user.
USER node

# Entry point
CMD [ "npm", "run", "start:prod:workers" ]