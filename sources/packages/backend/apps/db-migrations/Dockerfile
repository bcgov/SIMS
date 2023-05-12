# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

# Set the working directory
WORKDIR /app

# Copying package.json and package-lock.json
COPY package*.json ./app/

# Installing dependencies
RUN npm ci --ignore-scripts

# Copying sources
COPY apps/db-migrations ./app/apps/db-migrations
COPY tsconfig.json ./app/
COPY tsconfig.build.json ./app/
COPY env-setup.js ./app/

# Building app
RUN npm run build db-migrations

# Create a non-root user
RUN groupadd -r nonroot && useradd -r -g nonroot nonroot

# Give ownership of the application directory to the non-root user
RUN chown -R nonroot:nonroot /app

# Switch to the non-root user
USER nonroot

# Entry point
CMD [ "npm", "run", "start:prod:db-migrations" ]
