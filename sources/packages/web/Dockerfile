FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi9/nodejs-22:1-59 AS builder

# Application Port.
ENV PORT 3030

COPY ./package*.json ./
RUN npm ci
COPY . ./

# Replace ${PORT} variable in the template and save as default.conf.
RUN sed 's/${PORT}/'"${PORT}"'/g' nginx/default.conf.template > default.conf

RUN npm run build

FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi8/nginx-122 AS deployer

USER default

WORKDIR /opt/app-root/src

# Copy the app built on build-stage to the resulting container.
COPY --from=builder /opt/app-root/src/dist .

# Copy the default.conf to /etc/nginx/conf.d
COPY --from=builder /opt/app-root/src/default.conf /etc/nginx/conf.d

# Copying the main configuration file.
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Daemon off makes nginx to run on the foreground with only one process.
# Docker will kill the container if the process dies.
CMD ["nginx", "-g", "daemon off;"]