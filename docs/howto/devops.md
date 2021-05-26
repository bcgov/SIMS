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
    - [OpenShift Setup](#openshift-setup)
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

- Setup Zone B sFTP secrets: `make init-zone-b-sftp-secret`

- Build API: `make oc-build-api`

- Build Web app: `make oc-build-web`

- Deploy API: `make oc-deploy-api`

- Deploy Web app: `make oc-deploy-web`

Some additional commands,

- Create new database: `make create-new-db NEW_DB=newdbname JOB_NAME=openshift-jobname`

## CI-CD Pipeline And Github Actions

Currently we are using Github action to build CI/CD pipeline.

We currently use 2 workflows

1. Github action automatically deploying to "dev" once a PR is merged

2. Github action manually triggered to deploy to test based off an image tag provided that was built by #
