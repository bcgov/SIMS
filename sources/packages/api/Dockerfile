# Base Image
FROM registry.access.redhat.com/ubi8/nodejs-16:1-5

LABEL maintainer="BC GOV"


# Application Port
ENV PORT 3000


# Copying package.json and package-lock.json
COPY ./package*.json ./

# Installing dependencies
RUN npm ci

# Copying sources
COPY . .

# Building app
RUN npm run build

# Exposing application port
EXPOSE ${PORT}

# Entry point
CMD [ "npm", "run", "start:prod" ]