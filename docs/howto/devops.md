# DevOps

This document will explain DevOps setup and utilities for AEST/SIMS project.

N.B: ROOT means repository root directory

## Table of Content

- [DevOps](#devops)
  - [Table of Content](#table-of-content)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [OpenShift](#openshift)
    - [OpenShift Login](#openshift-login)
    - [OpenShift Infrastructure](#openshift-infrastructure)
    - [OpenShift Template files](#openshift-template-files)
      - [Database Backups](#database-backups)
    - [OpenShift Setup](#openshift-setup)
      - [FORMSFLOWAI Setup](#formsflowai-setup)
        - [New Environment Setup](#new-environment-setup)
        - [Upgrade a New Version](#upgrade-a-new-version)
  - [CI-CD Pipeline And Github Actions](#ci-cd-pipeline-and-github-actions)

## Prerequisites

1. OpenShift namespace
2. [OpenShit Client (OC CLI)](https://docs.openshift.com/container-platform/4.2/cli_reference/openshift_cli/getting-started-cli.html#cli-installing-cli_cli-developer-commands)
3. Keycloak realm
4. [Docker](https://store.docker.com/search?type=edition&offering=community) (For local development only)
5. Make cmd (For local development only - windows users)
   6.Test cmd (You can comment out when using as well - windows users)

## Local Development

1. Clone Repo to local machine
   `git clone https://github.com/bcgov/SIMS`

2. Create .env file in repo Root dir, for reference check /config/env-example for env reference. Change directory to `ROOT/sources/` and

3. To build application: `make local-build`

4. To run all application stack: `make local`

5. To stop all application stack: `make stop`

6. To clean all application including storage: `make local-clean`

7. To run database only: `make postgres`

8. To run api with database: `make local-api`

9. Shell into local api container: `make api`

10. Run api test on Docker: `make test-api`

## OpenShift

OpenShift is cloud-native deployment platform to run all our application stacks. The OpenShift (oc) CLI is required to run any OpenShit operation from local machine or OpenShift web console.

### OpenShift Login

- Developer need an account on OpenShift 4 cluster managed by BC Gov.

- Copy temporary token from web console and use
  `oc login --token=#Token --server=https://api.silver.devops.gov.bc.ca:6443`

- After login please verify all the attached namespaces: `oc projects`

- Select any project: `oc project #ProjectName`

### OpenShift Infrastructure

- Application images are building on a single namespace (tools namespace)

- Images are promoted to different environment using Deployment Config.

- All application secrets and configs are kept in OpenShift Secret and config maps. Theses values are injected to target application through deployment config.

### OpenShift Template files

Under `ROOT/devops/openshift/`, all the OpenShift related template file are stored.

- `docker-build.yml`: Generic builder template.
- `api-pre-req.yml`: Api deployment template that contains prerequisits that need to be executed manually in the Open Shift namespace where the `api-deploy.yml` will be executed.
- `api-deploy.yml`: Api deployment config template.
- `we-deploy.yml`: Web app deployment config template.
- `patroni-deploy.yml`: Patroni(Postgres) State-full-state deployment template.
- `patroni-pre-req.yml`: OpenShit secret creation template for Patroni app.
- `security-init.yml`: Network and security polices template to enable any namespace for application dev.
- `createdb-job.yml`: Job template to create separate database in patroni postgres database.

#### Database Backups

Under `ROOT/devops/openshift/database-backup`, all the OpenShift database backups related templates file are stored. The templates were copied and adapted from [BCDevOps backup-container](https://github.com/BCDevOps/backup-container).

The backups are executed using two different containers, one for Postgres databases and other for MongoDb databases. It follows what is decribed on [backup-container-options](https://github.com/BCDevOps/backup-container#backup-container-options) as a mixed environment where we have different containers to execute the backups for different databases types, but both are sharing the same backup configuration.

- `backup-build.yaml`: build template used by Postgres and Mongo DBs.
- `backup-deploy.yaml`: deploy template used by Postgres and Mongo.
- `backup-example.conf`: sample configuration for backups.
- `backup.conf`: current backup configuration shared by Postgres and Mongo DBs.

### OpenShift Setup

We have created a setup of make helper commands, Now we can perform following steps to setup any namespace.

- Setup your env variable in `ROOT/.env` file or in `ROOT/devops/Makefile`, sample env file is available under `ROOT/configs/env-example`. The list of essential env variables are

  1. NAMESPACE
  2. BUILD_NAMESPACE
  3. HOST_PREFIX (optional)
  4. BUILD_REF (optional, git brach/tag to use for building images)
  5. BUILD_ID (optional, default is 1)

- Login and select namespace

- Setup network and security policy: `make init-oc`

- Build Patroni: `make oc-build-patroni`

- Setup Patroni secrets: `make init-patroni`

- Deploy Patroni: `make oc-deploy-patroni`

- Setup API prerequisites (e.g. secrets): `make init-api`

- Setup Zone B SFTP secrets: `make init-zone-b-sftp-secret`

- Build API: `make oc-build-api`

- Build Web app: `make oc-build-web`

- Deploy API: `make oc-deploy-api`

- Deploy Web app: `make oc-deploy-web`

- Create backup config (shared for Postgres and Mongo): `make oc-db-backup-configmap-init`

- Build and deploy Postgress DB backup structure: `make oc-db-backup-init-postgresql`

- Build and deploy Mongo DB backup structure: `make oc-db-backup-init-mongodb`

#### FORMSFLOWAI Setup

##### New Environment Setup

We have created a setup of make helper commands to setup new formsflow.ai setup or just upgrade with the new version.
Now we can perform following steps to setup any namespace.

- Setup your env variable in `ROOT/.env` file or in `ROOT/devops/Makefile`, sample env file is available under `ROOT/configs/env-example`. The list of essential env variables are

  1. NAMESPACE
  2. HOST_PREFIX
  3. ${HOST_PREFIX} (optional, default is 1)

- Build to a particular branch: `make oc-build-forms-flow-ai`

- Create Mongo DB: `make oc-deploy-ha-mongo NAMESPACE=${NAMESPACE}`

- Populate SecretParam file in `ROOT/devops/openshift/forms-flow-ai/secrets/secrets-param.yml`

- Create Secrets : `make oc-forms-flow-ai-secrets NAMESPACE=${NAMESPACE}`

- Create Patroni DB’s : `make oc-forms-flow-ai-db NAMESPACE=${NAMESPACE}`

- Populate Configs in `ROOT/devops/openshift/forms-flow-ai/web-config.yml`

- Deploy the new version : ` make oc-deploy-forms-flow-ai NAMESPACE=${NAMESPACE} HOST_PREFIX=${HOST_PREFIX}`

- Update `ROOT/devops/openshift/forms-flow-ai/web-config.yml` with proper ID’s for REACT_APP_CLIENT_ID, REACT_APP_STAFF_REVIEWER_ID, REACT_APP_STAFF_DESIGNER_ID, REACT_APP_ANONYMOUS_ID

**_How to populate can be found in [Document](https://github.com/AOT-Technologies/forms-flow-ai/tree/master/forms-flow-forms#formsflow-forms-userrole-api)_**

##### Upgrade a New Version

- Particular branch build from formsflow.ai repo [FORMSFLOW.AI](https://github.com/AOT-Technologies/forms-flow-ai) : `make oc-build-forms-flow-ai`

- Populate Configs in `ROOT/devops/openshift/forms-flow-ai/web-config.yml`

- Deploy the new version: `make oc-deploy-forms-flow-ai NAMESPACE=${NAMESPACE} HOST_PREFIX=${HOST_PREFIX}`

- Update `ROOT/devops/openshift/forms-flow-ai/web-config.yml` with proper ID’s for REACT\*APP\*CLIENT_ID, REACT_APP_STAFF_REVIEWER_ID, REACT_APP_STAFF_DESIGNER_ID, REACT_APP_ANONYMOUS_ID.

**_How to populate can be found in [Document](https://github.com/AOT-Technologies/forms-flow-ai/tree/master/forms-flow-forms#formsflow-forms-userrole-api)_**

Additional commands for FormsFlowAI

**_Note: MODULE_NAME can be forms-flow-forms, forms-flow-bpm, forms-flow-api, forms-flow-web_**

- Build a particular module: `make oc-build-${MODULE_NAME}`

- Deploy particular module of a particular BUILD_ID: `make oc-deploy-${MODULE_NAME} NAMESPACE=${NAMESPACE} HOST_PREFIX=${HOST_PREFIX} BUILD_TAG=${BUILD_TAG}`

Some additional commands,

- Create new database: `make create-new-db NEW_DB=newdbname JOB_NAME=openshift-jobname`

- Delete the config map for databases config: `oc-db-backup-configmap-delete`

- Delete the resources associate with Postgres database (PVCs are not deleted): `oc-db-backup-delete-postgresql`

- Delete the resources associate with Mongo database (PVCs are not deleted): `oc-db-backup-delete-mongodb`

## CI-CD Pipeline And Github Actions

Currently we are using Github action to build CI/CD pipeline.

We currently use 2 workflows

1. Github action automatically deploying to "dev" once a PR is merged

2. Github action manually triggered to deploy to test based off an image tag provided that was built by #
