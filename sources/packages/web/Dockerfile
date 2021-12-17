FROM artifacts.developer.gov.bc.ca/redhat-docker-remote/ubi8/nodejs-16:1-5 as builder


COPY ./package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM artifacts.developer.gov.bc.ca/redhat-docker-remote/ubi8/nodejs-16:1-5 as deployer

RUN npm i -g serve
COPY --from=builder /opt/app-root/src/dist .
COPY --from=builder /opt/app-root/src/serve.json .

CMD ["sh", "-c","serve", "-p", "$PORT", "-s", "."]