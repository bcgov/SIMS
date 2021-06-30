# Used by docker-compose.yml to deploy the formio application
# (When modified, you must include `--build` )
# -----------------------------------------------------------

# Use Node image, maintained by Docker:
# hub.docker.com/r/_/node/
FROM docker-remote.artifacts.developer.gov.bc.ca/node:12.2.0-alpine

# "bcrypt" requires python/make/g++, all must be installed in alpine
# (note: using pinned versions to ensure immutable build environment)
RUN apk update && \
  apk upgrade && \
  apk add make=4.2.1-r2 && \
  apk add g++=8.3.0-r0 &&\
  apk add git

# Clone code
RUN git clone -b ${FORMIO_SOURCE_REPO_BRANCH} ${FORMIO_SOURCE_REPO_URL} /tmp/forms-flow-ai/
RUN cp -r /tmp/forms-flow-ai/forms-flow-forms/. /forms/

WORKDIR /forms

ENV PATH /forms/node_modules/.bin:$PATH

RUN npm install

# Set this to inspect more from the application. Examples:
#   DEBUG=formio:db (see index.js for more)
#   DEBUG=formio:*
ENV DEBUG=""

COPY . /forms/

RUN set -x \
  && chmod -R 777 /forms/

# This will initialize the application based on
# some questions to the user (login email, password, etc.)
ENTRYPOINT [ "node", "main" ]