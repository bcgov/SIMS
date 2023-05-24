# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

# Application Port
ENV PORT 3000

# Copying root files to image workdir.
COPY /*.json /*.js ./

# Installing dependencies
RUN npm ci

# Copying sources.
COPY ./apps/api ./apps/api
COPY ./apps/db-migrations ./apps/db-migrations
COPY ./apps/test-db-seeding ./apps/test-db-seeding
COPY ./libs ./libs

# Building app
RUN npm run build api

# Exposing application port
EXPOSE ${PORT}

# Ensure that the non-root user can build the test-db-seeding.
RUN mkdir -p /app/dist/apps/test-db-seeding/ && chown node /app/dist/apps/test-db-seeding/
# Ensure that the non-root user will be able to write the coverage report.
RUN mkdir -p /app/apps/api/coverage/ && chown node /app/apps/api/coverage/

# Executing the image with a non-root user.
USER node

# Entry point
CMD [ "npm", "run", "start:prod:api" ]