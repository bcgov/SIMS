# Modified by Yichun Zhao and Walter Moar

# Maven build
FROM docker-remote.artifacts.developer.gov.bc.ca/maven:3.6.1-jdk-11-slim AS MAVEN_TOOL_CHAIN

# set working directory
WORKDIR /bpm

RUN apt-get update \
  && apt-get install -y git
RUN git clone -b ${FORMIO_SOURCE_REPO_BRANCH} ${FORMIO_SOURCE_REPO_URL} /tmp/forms-flow-ai/
RUN cp -r /tmp/forms-flow-ai/forms-flow-bpm/. /bpm/
RUN cp /bpm/pom-docker.xml /bpm/pom.xml
RUN cp /bpm/settings-docker.xml /usr/share/maven/ref/
RUN mvn -s /usr/share/maven/ref/settings-docker.xml clean package


# Final custom slim java image (for apk command see jdk-11.0.3_7-alpine-slim)
FROM docker-remote.artifacts.developer.gov.bc.ca/adoptopenjdk/openjdk11:jdk-11.0.3_7-alpine

ENV JAVA_VERSION jdk-11.0.3+7
ENV JAVA_HOME=/opt/java/openjdk \
  PATH="/opt/java/openjdk/bin:$PATH"

EXPOSE 8080
# Add spring boot application
RUN mkdir -p /app
COPY --from=MAVEN_TOOL_CHAIN /bpm/target/forms-flow-bpm.jar ./app
RUN chmod a+rwx -R /app
WORKDIR /app
VOLUME /bpm
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/app/forms-flow-bpm.jar"]