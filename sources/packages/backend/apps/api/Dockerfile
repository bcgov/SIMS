# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

# Application Port
ENV PORT 3000


# Copying package.json and package-lock.json
COPY package*.json ./

# Installing dependencies
RUN npm ci --ignore-scripts

# Copying sources
COPY apps/api ./apps/api
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY env-setup.js ./

# Building app
RUN npm run build api

# Exposing application port
EXPOSE ${PORT}

# Set the non-root user
USER node

# Entry point
CMD [ "npm", "run", "start:prod:api" ]