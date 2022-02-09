FROM docker-remote.artifacts.developer.gov.bc.ca/python:3.9-slim-buster

RUN apt-get update && apt-get install -y git 

# set working directory
WORKDIR /api

RUN git clone -b ${FORMIO_SOURCE_REPO_BRANCH} ${FORMIO_SOURCE_REPO_URL} /tmp/forms-flow-ai/
RUN cp -r /tmp/forms-flow-ai/forms-flow-api/. /api/

RUN : \
  && python3 -m venv /venv \
  && pip install --upgrade pip \
  && pip install -r requirements.txt 

RUN pip install -e .

EXPOSE 5000
RUN chmod u+x ./entrypoint
ENTRYPOINT ["/bin/sh", "entrypoint"]