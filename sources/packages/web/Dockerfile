FROM registry.access.redhat.com/ubi8/nodejs-16:1-5 AS builder


COPY ./package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM registry.access.redhat.com/ubi8/nginx-120 AS deployer

RUN mkdir /app

# Copy the app built on build-stage to the resulting container.
COPY --from=builder /opt/app-root/src/dist /app

# Copying the configuration file.
COPY nginx.conf /etc/nginx/nginx.conf

# Daemon off makes nginx to run on the foreground with only one process.
# Docker will kill the container if the process dies.
CMD ["nginx", "-g", "daemon off;"]