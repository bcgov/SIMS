# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"

# Copying package.json and package-lock.json
COPY ./package.json ./

# Installing dependencies
RUN npm i

# Copying sources
COPY . .

# Building app
RUN npm run build db-migrations

# Entry point
CMD [ "npm", "run", "start:prod:db-migrations" ]