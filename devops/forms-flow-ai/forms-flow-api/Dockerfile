FROM docker-remote.artifacts.developer.gov.bc.ca/python:3.8

RUN apt-get update && apt-get install -y git 

# set working directory
WORKDIR /api

RUN git clone -b ${FORMIO_SOURCE_REPO_BRANCH} ${FORMIO_SOURCE_REPO_URL} /tmp/forms-flow-ai/
RUN cp -r /tmp/forms-flow-ai/forms-flow-api/. /api/

RUN pip install --upgrade pip
RUN pip install psycopg2

RUN pip install -e .

RUN mkdir /nltk_data && chmod 777 /nltk_data
RUN python -m nltk.downloader punkt vader_lexicon subjectivity

EXPOSE 5000
RUN chmod u+x ./entrypoint
ENTRYPOINT ["/bin/sh", "entrypoint"]