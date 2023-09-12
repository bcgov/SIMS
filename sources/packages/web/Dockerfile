FROM registry.access.redhat.com/ubi8/nodejs-16:1-5 AS builder


COPY ./package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM registry.access.redhat.com/ubi8/nginx-122 AS deployer

RUN mkdir /app

WORKDIR /app

# Copy the app built on build-stage to the resulting container.
COPY --from=builder /opt/app-root/src/dist .

# Copying the main configuration file.
COPY nginx.conf /etc/nginx/nginx.conf

# Copying the configuration template file to templates dir. 
# It will be processed to transform the vars in the template files into 
# evaluated values and save the resulting file as /etc/nginx/conf.d/default.conf.
COPY default.conf.template /etc/nginx/templates/

# Daemon off makes nginx to run on the foreground with only one process.
# Docker will kill the container if the process dies.
CMD ["nginx", "-g", "daemon off;"]