-include ../.env

export $(shell sed 's/=.*//' ../.env)
export GIT_LOCAL_BRANCH?=$(shell git rev-parse --abbrev-ref HEAD)
export PROJECT_NAME := $(or $(PROJECT_NAME), aest-sims)
export BUILD_REF :=  $(or $(BUILD_REF), dev)
export BUILD_ID := $(or $(BUILD_ID), 0)
export API_PORT := $(or $(API_PORT), 3000)
export QUEUE_CONSUMERS_PORT := $(or $(QUEUE_CONSUMERS_PORT), 3001)
export LOAD_TEST_API_PORT := $(or $(LOAD_TEST_API_PORT), 3005)
export APP_PORT := $(or $(APP_PORT), 8080)
export WORKERS_PORT := $(or $(WORKERS_PORT), 3020)
export CLAMAV_PORT := $(or $(CLAMAV_PORT), 3310)
# Database
export POSTGRES_PORT := $(or $(POSTGRES_PORT), 5432)
export POSTGRES_USER := $(or $(POSTGRES_USER), admin)
export POSTGRES_PASSWORD := $(or $(POSTGRES_PASSWORD), aest_sim)
export POSTGRES_DB := $(or $(POSTGRES_DB), aest)
# Queue
export REDIS_PORT := $(or $(REDIS_PORT), 6379)
export REDIS_PASSWORD := $(or $(REDIS_PASSWORD), redis)
export REDIS_STANDALONE_MODE := $(or $(REDIS_STANDALONE_MODE), true)
export QUEUE_DASHBOARD_PASSWORD := $(or $(QUEUE_DASHBOARD_PASSWORD), queueboardpass)
export QUEUE_DASHBOARD_USER := $(or $(QUEUE_DASHBOARD_USER), queueBoardUser)
export QUEUE_PREFIX := $(or $(QUEUE_PREFIX), {sims-local})
# Key Cloak
export KEYCLOAK_AUTH_URL := $(or $(KEYCLOAK_AUTH_URL), https://dev.loginproxy.gov.bc.ca/auth/)
export KEYCLOAK_REALM := $(or $(KEYCLOAK_REALM), aestsims)
export KEYCLOAK_CLIENT_STUDENT := $(or $(KEYCLOAK_CLIENT_STUDENT), student)
export KEYCLOAK_CLIENT_INSTITUTION := $(or $(KEYCLOAK_CLIENT_INSTITUTION), institution)
export KEYCLOAK_CLIENT_AEST := $(or $(KEYCLOAK_CLIENT_AEST), aest)
export KEYCLOAK_CLIENT_SUPPORTING_USERS := $(or $(KEYCLOAK_CLIENT_SUPPORTING_USERS), supporting-users)
# E2E Test
export E2E_TEST_STUDENT_USERNAME := $(or $(E2E_TEST_STUDENT_USERNAME), student_e2e_test)
export E2E_TEST_BCeID_USERNAME := $(or $(E2E_TEST_BCeID_USERNAME), SIMS_E2ETests)
# BCeID Web Service
export BCeID_WEB_SERVICE_WSDL := $(or $(BCeID_WEB_SERVICE_WSDL), https://gws1.test.bceid.ca/webservices/Client/V10/BCeIDService.asmx?wsdl)
# File Upload Global Config
export FILE_UPLOAD_MAX_FILE_SIZE := $(or $(FILE_UPLOAD_MAX_FILE_SIZE), 15728640)
export FILE_UPLOAD_ALLOWED_EXTENSIONS := $(or $(FILE_UPLOAD_ALLOWED_EXTENSIONS), .pdf,.doc,.docx,.jpg,.png)
#SFAS Integration
export SFAS_RECEIVE_FOLDER := $(or $(SFAS_RECEIVE_FOLDER), SFAS-Receive)
# Fulltime Allowed
export IS_FULLTIME_ALLOWED := $(or $(IS_FULLTIME_ALLOWED), true)
#Institution Integration
export INSTITUTION_REQUEST_FOLDER := $(or $(INSTITUTION_REQUEST_FOLDER), OUT)
export INSTITUTION_RESPONSE_FOLDER := $(or $(INSTITUTION_RESPONSE_FOLDER), IN)
export SWAGGER_ENABLED := $(or ${SWAGGER_ENABLED}, true)
export APPLICATION_ARCHIVE_DAYS := $(or ${APPLICATION_ARCHIVE_DAYS}, 43)
#Formio forms integration
export FORMIO_SOURCE_REPO_URL := $(or ${FORMIO_SOURCE_REPO_URL}, https://github.com/formio/formio.git)
export FORMIO_SOURCE_REPO_TAG := $(or ${FORMIO_SOURCE_REPO_TAG}, v2.5.3)
#ATBC Integration
export ATBC_USERNAME := $(or $(ATBC_USERNAME), )
export ATBC_PASSWORD := $(or $(ATBC_PASSWORD), )
export ATBC_APP := $(or $(ATBC_APP), )
export ATBC_ENDPOINT := $(or $(ATBC_ENDPOINT), )
export ATBC_LOGIN_ENDPOINT := $(or $(ATBC_LOGIN_ENDPOINT), )
# ESDC
export ESDC_REQUEST_FOLDER := $(or $(ESDC_REQUEST_FOLDER), MSFT-Request)
export ESDC_RESPONSE_FOLDER := $(or $(ESDC_RESPONSE_FOLDER), MSFT-Response)
export ESDC_ENVIRONMENT_CODE := $(or $(ESDC_ENVIRONMENT_CODE), )
# CRA
export CRA_REQUEST_FOLDER := $(or $(CRA_REQUEST_FOLDER), CRA-Request)
export CRA_RESPONSE_FOLDER := $(or $(CRA_RESPONSE_FOLDER), CRA-Response)
export CRA_PROGRAM_AREA_CODE := $(or $(CRA_PROGRAM_AREA_CODE), )
export CRA_ENVIRONMENT_CODE := $(or $(CRA_ENVIRONMENT_CODE), )
# Versions used by camunda-docker compose-core.yml during the make camunda.
# Versions upgraded following the conbination available on https://github.com/camunda/camunda-platform/blob/main/.env
export CAMUNDA_CONNECTORS_VERSION := $(or $(CAMUNDA_CONNECTORS_VERSION), 8.5.3)
export CAMUNDA_PLATFORM_VERSION := $(or $(CAMUNDA_PLATFORM_VERSION), 8.5.2)
export ELASTIC_VERSION := $(or $(ELASTIC_VERSION), 8.14.3)
# Camunda default values for local development.
export CAMUNDA_OAUTH_DISABLED := $(or $(CAMUNDA_OAUTH_DISABLED), true)
export CAMUNDA_SECURE_CONNECTION := $(or $(CAMUNDA_SECURE_CONNECTION), false)
export ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS := $(or $(ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS), 45)
# CAS
export CAS_BASE_URL := $(or $(CAS_BASE_URL), )
export CAS_CLIENT_ID := $(or $(CAS_CLIENT_ID), )
export CAS_CLIENT_SECRET := $(or $(CAS_CLIENT_SECRET), )

# Logged Out due to inactivity in seconds.
export MAXIMUM_IDLE_TIME_FOR_WARNING_STUDENT :=  $(or $(MAXIMUM_IDLE_TIME_FOR_WARNING_STUDENT), 270)
export MAXIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER :=  $(or $(MAXIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER), 270)
export MAXIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION := $(or $(MAXIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION), 3600)
export MAXIMUM_IDLE_TIME_FOR_WARNING_AEST :=  $(or $(MAXIMUM_IDLE_TIME_FOR_WARNING_AEST), 3600)

# Starts all applications: SIMS application (Web Portals, SIMS Api, Workers, Queue Consumers),
# and also Form.io server, and Camunda releated services.
# Use make deploy-camunda-definitions to deploy all workflow definitions.
# Use make deploy-form-definitions to deploy all form.io definitions.
local-all: | print-status forms camunda local-build-run

local:	| print-status local-build-run
local-api: | print-status local-build api-only
db: | print-status postgres
local-redis: | print-status redis

####################################################################
## Status Output
####################################################################

print-status:
	@echo " +---------------------------------------------------------+ "
	@echo " | Current Settings                                        | "
	@echo " +---------------------------------------------------------+ "
	@echo " | BUILD_TAG: $(BUILD_TAG) "
	@echo " | PROJECT: $(PROJECT_NAME) "
	@echo " | API_PORT: $(API_PORT) "
	@echo " | APP_PORT: $(APP_PORT) "
	@echo " | Database Configs"
	@echo " | POSTGRES_PORT: $(POSTGRES_PORT) "
	@echo " | POSTGRES_DB: $(POSTGRES_DB) "
	@echo " | POSTGRES_USER: $(POSTGRES_USER) "
	@echo " | POSTGRES_PASSWORD: $(POSTGRES_PASSWORD) "
	@echo " | Queue Configs"
	@echo " | REDIS_PORT: $(REDIS_PORT) "
	@echo " | REDIS_PASSWORD: $(REDIS_PASSWORD) "
	@echo " | REDIS_STANDALONE_MODE: $(REDIS_STANDALONE_MODE) "
	@echo " | Key Cloak Configs"
	@echo " | KEYCLOAK_AUTH_URL: $(KEYCLOAK_AUTH_URL) "
	@echo " | KEYCLOAK_REALM: $(KEYCLOAK_REALM) "
	@echo " | KEYCLOAK_CLIENT: $(KEYCLOAK_CLIENT) "
	@echo " | E2E Test"
	@echo " | E2E_TEST_STUDENT_USERNAME: $(E2E_TEST_STUDENT_USERNAME) "
	@echo " | E2E_TEST_BCeID_USERNAME: $(E2E_TEST_BCeID_USERNAME) "
	@echo " | BCeID Web Service"
	@echo " | BCeID_WEB_SERVICE_WSDL: $(BCeID_WEB_SERVICE_WSDL) "
	@echo " +---------------------------------------------------------+ "

#################################################################
## Local Build/Run
#################################################################

# Build locally
local-build:
	@echo "+\n++ Make: Building locally ...\n+"
	@docker compose -f docker-compose.yml build

# Run locally
local-run:
	@echo "+\n++ Make: Run locally ...\n+"
	@docker compose -f docker-compose.yml up

# Build and run locally
local-build-run:
	@echo "+\n++ Make: Build / Run locally ...\n+"
	@docker compose -f docker-compose.yml up --build

# Stop locally
local-stop:
	@echo "+\n++ Make: Stop local app ...\n+"
	@docker compose -f docker-compose.yml down

# Clean locally
local-clean:
	@echo "+\n++ Make: Clean local app ...\n+"
	@docker compose -f docker-compose.yml down -v

# Local DB
postgres:
	@echo "+\n++ Make: Run local db.\n+"
	@docker compose -f docker-compose.yml up postgres

# Local Queue
redis:
	@echo "+\n++ Make: Run local queue.\n+"
	@docker compose -f docker-compose.yml up redis

# Local API only
api-only:
	@echo "+\n++ Make: Building and running API only"
	@docker compose -f docker-compose.yml up api

# Local App
api: ## <Helper> :: Executes into the workspace container.
	@echo "+\n++Shelling into local workspace ...++\n+"
	@docker compose exec api bash

# Local Web (nginx)
web-local:
	@echo "+\n++ Make: Run local web (nginx).\n+"
	@docker compose -f docker-compose.yml up --build -d web

local-db:
	@echo "Make: Shelling into database workspace ..."
	@docker compose -f docker-compose.yml exec postgres psql -U $(POSTGRESQL_USER) -W $(POSTGRES_DB)

# Build and run Camunda locally.
camunda:
	@echo "Create Camunda locally (Zeebe, Operate, Tasklist, and Elasticsearch)..."
	@echo "- Use user and password as 'demo' to login to Operate."
	@echo "- Use Zeebe address env variable as 'ZEEBE_ADDRESS=localhost:26500' to connect to the local environment."
	@echo "- Use endpoint http://localhost:26500 to deploy to the local environment from the desktop modeler."
	@docker compose -f camunda-docker-compose-core.yml up -d

# Stops Camunda locally.
camunda-stop:
	@echo "Stopping Camunda locally..."
	@docker compose -f camunda-docker-compose-core.yml down

# Deploy Camunda defitions locally
deploy-camunda-definitions:
	@cd ./packages/backend && npm i && npm run deploy:camunda:definitions

# Build and deploy forms locally.
forms:
	@echo "Build, deploy forms and deploy form-definitions locally... \n+"
	@echo "Login to http://localhost:3001 \n+"
	@echo "Default user/password as admin@example.com/CHANGEME \n+"
	@docker compose -f forms-docker-compose.yml up --build -d

# Deploy form-definitions locally
deploy-form-definitions:
	@cd ./packages/forms && npm i && npm run deploy

# Stop locally
forms-stop:
	@echo "+\n++ Stopping formio forms locally...\n+"
	@docker compose -f forms-docker-compose.yml down

# Runs queue consumer application
queue-consumers:
	@echo "+\n++ Make: Queue only"
	@docker compose -f docker-compose.yml build queue-consumers
	@docker compose -f docker-compose.yml up -d queue-consumers

# Runs clamav
clamav:
	@echo "+\n++ Make: ClamAV only"
	@docker compose -f docker-compose.yml build clamav
	@docker compose -f docker-compose.yml up -d clamav

# Runs load test gateway application
load-test-gateway:
	@echo "+\n++ Make: Load test gateway only"
	@docker compose -f docker-compose.yml build load-test-gateway
	@docker compose -f docker-compose.yml up -d load-test-gateway

# Runs workers application
workers:
	@echo "+\n++ Make: Camunda workers only"
	@docker compose -f docker-compose.yml build workers
	@docker compose -f docker-compose.yml up -d workers

# Enable local DB connection to Openshift DEV/TEST/QA/STG/PROD
connect-dev-db:
	@echo "Forward local port 5454 to Openshift simsdb-pgbouncer default port."
	@echo "Use your prefered DB Manager (e.g. pgAdmin or DBeaver) to connect to the Postgres database using the local port 5454."
	@oc project 0c27fb-dev
	@oc port-forward services/simsdb-pgbouncer 5454:5432

connect-test-db:
	@echo "Forward local port 5555 to Openshift simsdb-pgbouncer default port."
	@echo "Use your prefered DB Manager (e.g. pgAdmin or DBeaver) to connect to the Postgres database using the local port 5555."
	@oc project 0c27fb-test
	@oc port-forward services/simsdb-pgbouncer 5555:5432

connect-qa-db:
	@echo "Forward local port 5656 to Openshift simsdb-pgbouncer default port."
	@echo "Use your prefered DB Manager (e.g. pgAdmin or DBeaver) to connect to the Postgres database using the local port 5656."
	@oc project 0c27fb-test
	@oc port-forward services/simsdb-pgbouncer 5656:5432

connect-stg-db:
	@echo "Forward local port 5757 to Openshift simsdb-pgbouncer default port."
	@echo "Use your prefered DB Manager (e.g. pgAdmin or DBeaver) to connect to the Postgres database using the local port 5757."
	@oc project a6ef19-test
	@oc port-forward services/simsdb-pgbouncer 5757:5432

connect-prod-db:
	@echo "Forward local port 5858 to Openshift simsdb-pgbouncer default port."
	@echo "Use your prefered DB Manager (e.g. pgAdmin or DBeaver) to connect to the Postgres database using the local port 5858."
	@oc project 0c27fb-prod
	@oc port-forward services/simsdb-pgbouncer 5858:5432
