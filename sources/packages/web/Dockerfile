# "builder" stage, based on Node.js, to build and compile the frontend.
# dependabot: FROM node:25.6.1-alpine3.22
FROM artifacts.developer.gov.bc.ca/docker-remote/node:25.6.1-alpine3.22 AS builder

# Application Port.
ENV PORT=3030

# Setting app as work dir.
WORKDIR /app

# Copying sources.
COPY ./src ./src
COPY ./nginx ./nginx
COPY ./public ./public
COPY ./index.html ./vite.config.ts ./tsconfig.json ./package*.json ./

# Installing dependencies.
RUN npm ci

# Replace ${PORT} variable in the template and save as default.conf.
RUN sed 's/${PORT}/'"${PORT}"'/g' nginx/default.conf.template > default.conf

# Building app
RUN npm run build

# dependabot: FROM nginx:1.29.3-alpine3.22
FROM artifacts.developer.gov.bc.ca/docker-remote/nginx:1.29.3-alpine3.22 AS deployer

# Copy the app built on builder stage to the resulting container.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the default.conf to /etc/nginx/conf.d
COPY --from=builder /app/default.conf /etc/nginx/conf.d/default.conf

# Copying the main configuration file.
COPY --from=builder /app/nginx/nginx.conf /etc/nginx/nginx.conf

# Set proper permissions for OpenShift (arbitrary UIDs with root group).
# Make required files/directories writable by GID 0 (root group).
RUN mkdir -p /var/log/nginx && \
    chgrp -R 0 /usr/share/nginx/html /var/cache/nginx /var/run /etc/nginx /var/log/nginx && \
    chmod -R g=u /usr/share/nginx/html /var/cache/nginx /var/run /etc/nginx /var/log/nginx

# Daemon off makes nginx to run on the foreground with only one process.
# Docker will kill the container if the process dies.
CMD ["nginx", "-g", "daemon off;"]