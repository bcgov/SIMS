# Use Node image, maintained by Docker: hub.docker.com/r/_/node.
FROM artifacts.developer.gov.bc.ca/docker-remote/node:20-alpine3.20

ARG FORMIO_SOURCE_REPO_URL
ARG FORMIO_SOURCE_REPO_TAG

# "bcrypt" requires python/make/g++, all must be installed in alpine.
# Note: using pinned versions to ensure immutable build environment.
RUN apk update && \
  apk upgrade && \
  apk add make && \
  apk add python3 && \
  apk add g++ && \
  apk add git && \
  apk cache clean

# Clone code into formio folder, by default.
RUN git clone ${FORMIO_SOURCE_REPO_URL} -b ${FORMIO_SOURCE_REPO_TAG} --single-branch

RUN apk del git

WORKDIR /formio

# Use install as-is from package.json.
RUN npm i

# Set this to inspect more from the application. Examples:
#   DEBUG=formio:db (see index.js for more)
#   DEBUG=formio:*
ENV DEBUG=""

RUN set -x \
  && chmod -R 770 ./

# This will initialize the application based on
# some questions to the user (login email, password, etc.)
ENTRYPOINT [ "node", "main" ]