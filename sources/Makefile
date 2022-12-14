-include ../.env

export $(shell sed 's/=.*//' ../.env)
export GIT_LOCAL_BRANCH?=$(shell git rev-parse --abbrev-ref HEAD)
export PROJECT_NAME := $(or $(PROJECT_NAME), aest-sims)
export BUILD_REF :=  $(or $(BUILD_REF), dev)
export BUILD_ID := $(or $(BUILD_ID), 0)
export API_PORT := $(or $(API_PORT), 3000)
export QUEUE_CONSUMERS_PORT := $(or $(QUEUE_CONSUMERS_PORT), 3001)
export APP_PORT := $(or $(APP_PORT), 8080)
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
export KEYCLOAK_AUTH_URL := $(or $(KEYCLOAK_AUTH_URL), https://dev.oidc.gov.bc.ca/auth/)
export KEYCLOAK_REALM := $(or $(KEYCLOAK_REALM), jxoe2o46)
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
export FILE_UPLOAD_MAX_FILE_SIZE := $(or $(FILE_UPLOAD_MAX_FILE_SIZE), 4194304)
export FILE_UPLOAD_ALLOWED_EXTENSIONS := $(or $(FILE_UPLOAD_ALLOWED_EXTENSIONS), .pdf,.doc,.docx,.jpg,.png)
#SFAS Integration
export SFAS_RECEIVE_FOLDER := $(or $(SFAS_RECEIVE_FOLDER), SFAS-Receive)
#Institution Integration
export INSTITUTION_REQUEST_FOLDER := $(or $(INSTITUTION_REQUEST_FOLDER), Institution-Request)
export SWAGGER_ENABLED := $(or ${SWAGGER_ENABLED}, true)
export APPLICATION_ARCHIVE_DAYS := $(or ${APPLICATION_ARCHIVE_DAYS}, 43)
#Formio forms integration
export FORMIO_SOURCE_REPO_URL := $(or ${FORMIO_SOURCE_REPO_URL}, https://github.com/formio/formio.git)
export FORMIO_SOURCE_REPO_TAG := $(or ${FORMIO_SOURCE_REPO_TAG}, v2.5.3)


local:	| print-status local-build-run
local-api: | print-status local-build api-only
local-api-detached: | print-status local-build api-detached
db: | print-status postgres
local-redis: | print-status redis
test-api: | print-status local-api-test 

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
	@docker-compose -f docker-compose.yml build

# Run locally
local-run:
	@echo "+\n++ Make: Run locally ...\n+"
	@docker-compose -f docker-compose.yml up

# Build and run locally
local-build-run:
	@echo "+\n++ Make: Build / Run locally ...\n+"
	@docker-compose -f docker-compose.yml up --build

# Stop locally
local-stop:
	@echo "+\n++ Make: Stop local app ...\n+"
	@docker-compose -f docker-compose.yml down

# Clean locally
local-clean:
	@echo "+\n++ Make: Clean local app ...\n+"
	@docker-compose -f docker-compose.yml down -v

# Local DB
postgres:
	@echo "+\n++ Make: Run local db.\n+"
	@docker-compose -f docker-compose.yml up postgres

# Local Queue
redis:
	@echo "+\n++ Make: Run local queue.\n+"
	@docker-compose -f docker-compose.yml up redis

# Local API only
api-only:
	@echo "+\n++ Make: Building and running API only"
	@docker-compose -f docker-compose.yml up api

api-detached:
	@echo "+\n++ Make: Running DB and API only"
	@docker-compose -f docker-compose.yml up -d api

# Local App
api: ## <Helper> :: Executes into the workspace container.
	@echo "+\n++Shelling into local workspace ...++\n+"
	@docker-compose exec api bash

local-api-test: ## Run API tests
	@echo "+\n++ Run API tests+\n++"
	@docker-compose exec -T api npm run test
	@docker-compose exec -T api npm run test:e2e

local-db:
	@echo "Make: Shelling into database workspace ..."
	@docker-compose -f docker-compose.yml exec postgres psql -U $(POSTGRESQL_USER) -W $(POSTGRES_DB)

# Build and run Camunda locally.
camunda:
	@echo "Create Camunda locally (Zeebe, Operate, Tasklist, and Elasticsearch)..."
	@echo "- Use user and password as 'demo' to login to Operate."
	@echo "- Use Zeebe address env variable as 'ZEEBE_ADDRESS=localhost:26500' to connect to the local environment."
	@echo "- Use endpoint http://localhost:26500 to deploy to the local environment from the desktop modeler."
	@docker-compose -f camunda-docker-compose-core.yml up -d

# Stops Camunda locally.
camunda-stop:
	@echo "Stopping Camunda locally..."
	@docker-compose -f camunda-docker-compose-core.yml down

# Build and deploy forms locally.
forms:
	@echo "Build, deploy forms and deploy form-definitions locally... \n+"
	@echo "Login to http://localhost:3001 \n+"
	@echo "Default user/password as admin@example.com/CHANGEME \n+"
	@docker-compose -f forms-docker-compose.yml up --build -d

#deploy form-definitions locally
deploy-form-definitions:
	@cd ./packages/forms && npm i && npm run deploy

# Stop locally
forms-stop:
	@echo "+\n++ Stopping formio forms locally...\n+"
	@docker-compose -f forms-docker-compose.yml down
	
# Runs queue consumer application
queue-consumers:
	@echo "+\n++ Make: Queue only"
	@docker-compose -f docker-compose.yml build queue-consumers
	@docker-compose -f docker-compose.yml up -d queue-consumers



