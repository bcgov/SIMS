# Used by docker-compose.yml to deploy the formio application
# (When modified, you must include `--build` )
# -----------------------------------------------------------

# Use Node image, maintained by Docker:
# hub.docker.com/r/_/node/
FROM artifacts.developer.gov.bc.ca/docker-remote/node:20-alpine3.19

WORKDIR /app
ARG FORMIO_SOURCE_REPO_URL
ARG FORMIO_SOURCE_REPO_TAG

# "bcrypt" requires python/make/g++, all must be installed in alpine
# (note: using pinned versions to ensure immutable build environment)
RUN apk update && \
    apk upgrade && \
    apk add make && \
    apk add python3 && \
    apk add g++ && \
    apk add git

# Clone code
RUN git clone ${FORMIO_SOURCE_REPO_URL} -b ${FORMIO_SOURCE_REPO_TAG} --single-branch /app/

# Using an alternative package install location
# to allow overwriting the /app folder at runtime
# stackoverflow.com/a/13021677
ENV NPM_PACKAGES=/.npm-packages \
  PATH=$NPM_PACKAGES/bin:$PATH \
  NODE_PATH=$NPM_PACKAGES/lib/node_modules:$NODE_PATH
RUN echo "prefix = $NPM_PACKAGES" >> ~/.npmrc

# Include details of the required dependencies
RUN mkdir -p $NPM_PACKAGES/
# Include details of the required dependencies
RUN cp package.json $NPM_PACKAGES/

# Use install as-is from package.json
RUN npm i --prefix=$NPM_PACKAGES

# Link in the global install because `require()` only looks for ./node_modules
# WARNING: This is overwritten by volume-mount at runtime!
#          See docker-compose.yml for instructions
RUN ln -sf $NPM_PACKAGES/node_modules node_modules

# Set this to inspect more from the application. Examples:
#   DEBUG=formio:db (see index.js for more)
#   DEBUG=formio:*
ENV DEBUG=""

RUN set -x \
  && chmod -R 770 /app/

# This will initialize the application based on
# some questions to the user (login email, password, etc.)
ENTRYPOINT [ "node", "main" ]