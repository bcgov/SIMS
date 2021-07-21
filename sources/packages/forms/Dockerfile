ARG FORMS_URL
ARG FORMS_SA_USER_NAME
ARG FORMS_SA_PASSWORD

# Base Image
FROM node:12.18.3-slim

WORKDIR /forms-deploy

LABEL maintainer="BC GOV"

# Copying package.json and package-lock.json
COPY ./package*.json ./

# Installing dependencies.
RUN npm ci

ENV NODE_ENV production

# Copy soruce code to build.
COPY . /forms-deploy

# Building app
RUN npm run build

# Copying form definitions
ADD ./src/form-definitions /forms-deploy/dist/form-definitions

# Entry point
CMD [ "node", "dist/deploy-forms"]