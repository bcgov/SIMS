# Modified by Yichun Zhao and Walter Moar

# Maven build
FROM docker-remote.artifacts.developer.gov.bc.ca/maven:3.6.1-jdk-11-slim AS MAVEN_TOOL_CHAIN

# set working directory
WORKDIR /bpm/

RUN apt-get update \
  && apt-get install -y git
RUN git clone -b ${FORMIO_SOURCE_REPO_BRANCH} ${FORMIO_SOURCE_REPO_URL} /tmp/forms-flow-ai/
RUN cp -r /tmp/forms-flow-ai/forms-flow-bpm/. /bpm/
RUN cp /bpm/pom-docker.xml /bpm/pom.xml
RUN cp /bpm/settings-docker.xml /usr/share/maven/ref/

# This allows Docker to cache most of the maven dependencies
RUN mvn -s /usr/share/maven/ref/settings-docker.xml dependency:resolve-plugins dependency:resolve dependency:go-offline -B
RUN mvn -s /usr/share/maven/ref/settings-docker.xml package


# Final custom slim java image (for apk command see jdk-11.0.3_7-alpine-slim)
FROM docker-remote.artifacts.developer.gov.bc.ca/adoptopenjdk/openjdk11:jdk-11.0.3_7-alpine

ENV JAVA_VERSION jdk-11.0.3+7
ENV JAVA_HOME=/opt/java/openjdk \
  PATH="/opt/java/openjdk/bin:$PATH"

EXPOSE 8080
# OpenShift has /app in the image, but it's missing when doing local development - Create it when missing
RUN test ! -d /app && mkdir /app || :
# Add spring boot application
RUN mkdir -p /app
COPY --from=MAVEN_TOOL_CHAIN /bpm/target/camunda-bpm-identity-keycloak-examples-sso-kubernetes*.jar ./app
RUN chmod a+rwx -R /app
WORKDIR /app
VOLUME /tmp
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app/camunda-bpm-identity-keycloak-examples-sso-kubernetes.jar"]