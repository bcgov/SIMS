FROM artifacts.developer.gov.bc.ca/docker-remote/node:24.9.0-alpine3.21 AS builder

# Application Port.
ENV PORT 3030

# Setting app as work dir.
WORKDIR /app

# Copying package.json and package-lock.json.
COPY ./package*.json ./

# Installing dependencies.
RUN npm ci

# Copying sources.
COPY . .

# Replace ${PORT} variable in the template and save as default.conf.
RUN sed 's/${PORT}/'"${PORT}"'/g' nginx/default.conf.template > default.conf

# Building app
RUN npm run build-local

FROM artifacts.developer.gov.bc.ca/redhat-access-docker-remote/ubi8/nginx-122 AS deployer

USER default

RUN mkdir -p /opt/app-root/src \
 && mkdir -p /etc/nginx/conf.d

# Copy the app built on builder stage to the resulting container.
COPY --from=builder /app/dist /opt/app-root/src

# Copy the default.conf to /etc/nginx/conf.d
COPY --from=builder /app/default.conf /etc/nginx/conf.d/default.conf

# Copying the main configuration file.
COPY --from=builder /app/nginx/nginx.conf /etc/nginx/nginx.conf

# Daemon off makes nginx to run on the foreground with only one process.
# Docker will kill the container if the process dies.
CMD ["nginx", "-g", "daemon off;"]