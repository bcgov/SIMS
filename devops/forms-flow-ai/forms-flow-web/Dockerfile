# base image
FROM docker-remote.artifacts.developer.gov.bc.ca/node:12.4.0-alpine as build-stage

# set working directory
WORKDIR /web/

# add `/web/node_modules/.bin` to $PATH
ENV PATH /web/node_modules/.bin:$PATH

RUN apk update && apk upgrade && \
  apk add --no-cache bash git openssh

# Clone code
RUN git clone -b ${FORMIO_SOURCE_REPO_BRANCH} ${FORMIO_SOURCE_REPO_URL} /tmp/forms-flow-ai/
RUN cp -r /tmp/forms-flow-ai/forms-flow-web/. /web/

RUN npm install
RUN npm run build

FROM docker-remote.artifacts.developer.gov.bc.ca/nginx:1.17 as production-stage
RUN mkdir /nginx
COPY --from=build-stage /web/build /usr/share/nginx/html
RUN ls -lrt 
RUN ls -lrt /web/
RUN cp nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080:8080
CMD ["nginx", "-g", "daemon off;"]