# Base Image
FROM artifacts.developer.gov.bc.ca/docker-remote/node:24.9.0-alpine3.21

WORKDIR /app

# Copying package.json and package-lock.json
COPY package*.json ./

# Installing dependencies
RUN npm ci --ignore-scripts

# Copying sources
COPY apps/db-migrations ./apps/db-migrations
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY env-setup.js ./

# Entry point
# This docker file is shared by regular DB migrations and also
# allows an alternative entry point for executing it on REPL mode.
# The default entry point is to run the DB migrations.
CMD [ "node", "--run", "migration:run" ]
# Alternative entry point for REPL mode set on openshift/db-migrations-repl.yml
# CMD [ "npm", "run", "migration:repl" ]
