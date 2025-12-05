# "builder" stage, based on Node.js, to build and compile the frontend.
FROM artifacts.developer.gov.bc.ca/docker-remote/node:24.11.0-alpine3.22 AS builder

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

FROM artifacts.developer.gov.bc.ca/docker-remote/nginx:1.29-alpine AS deployer

# Copy the app built on builder stage to the resulting container.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the default.conf to /etc/nginx/conf.d
COPY --from=builder /app/default.conf /etc/nginx/conf.d/default.conf

# Copying the main configuration file.
COPY --from=builder /app/nginx/nginx.conf /etc/nginx/nginx.conf

# Set proper permissions for nginx user
RUN chown nginx /usr/share/nginx/html -R \
    && chown nginx /var/cache/nginx/ -R \
    && chown nginx /var/run -R \
    && chown nginx /etc/nginx/ -R

# Switch to non-root user
USER nginx

# Daemon off makes nginx to run on the foreground with only one process.
# Docker will kill the container if the process dies.
CMD ["nginx", "-g", "daemon off;"]