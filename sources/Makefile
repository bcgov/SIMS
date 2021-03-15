-include ../.env

export $(shell sed 's/=.*//' ../.env)
export GIT_LOCAL_BRANCH?=$(shell git rev-parse --abbrev-ref HEAD)
export PROJECT_NAME := $(or $(PROJECT_NAME), aest-sims)
export BUILD_REF :=  $(or $(BUILD_REF), dev)
export BUILD_ID := $(or $(BUILD_ID), 0)
export API_PORT := $(or $(API_PORT), 3000)
export APP_PORT := $(or $(APP_PORT), 8080)
# Database
export POSTGRES_PORT := $(or $(POSTGRES_PORT), 5432)
export POSTGRES_USER := $(or $(POSTGRES_USER), admin)
export POSTGRES_PASSWORD := $(or $(POSTGRES_PASSWORD), aest_sim)
export POSTGRES_DB := $(or $(POSTGRES_DB), aest)
# Key Cloak
export KEYCLOAK_AUTH_URL := $(or $(KEYCLOAK_AUTH_URL), https://dev.oidc.gov.bc.ca/auth/)
export KEYCLOAK_REALM := $(or $(KEYCLOAK_REALM), jxoe2o46)
export KEYCLOAK_CLIENT_STUDENT := $(or $(KEYCLOAK_CLIENT_STUDENT), student)
export KEYCLOAK_CLIENT_INSTITUTION := $(or $(KEYCLOAK_CLIENT_INSTITUTION), institution)
# E2E Test
export E2E_TEST_STUDENT_USERNAME := $(or $(E2E_TEST_STUDENT_USERNAME), student_e2e_test)
export E2E_TEST_BCeID_USERNAME := $(or $(E2E_TEST_BCeID_USERNAME), SIMS_E2ETests)
# BCeID Web Service
export BCeID_WEB_SERVICE_WSDL := $(or $(BCeID_WEB_SERVICE_WSDL), https://gws1.test.bceid.ca/webservices/Client/V10/BCeIDService.asmx?wsdl)

local:	| print-status local-build-run
local-api: | print-status local-build api-only
db: | print-status postgres
test-api: | print-status local-build api-detached local-api-test local-stop

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

# Local API only
api-only:
	@echo "+\n++ Make: Building and running API only"
	@docker-compose -f docker-compose.yml up -d postgres
	@docker-compose -f docker-compose.yml up api

api-detached:
	@echo "+\n++ Make: Running DB and API only"
	@docker-compose -f docker-compose.yml up -d postgres
	@docker-compose -f docker-compose.yml up -d api

# Local App
api: ## <Helper> :: Executes into the workspace container.
	@echo "+\n++Shelling into local workspace ...++\n+"
	@docker-compose exec api bash

local-api-test: ## Run API tests
	@echo "+\n++ Run API tests+\n++"
	@docker-compose exec api npm run test
	@docker-compose exec api npm run test:e2e

local-db:
	@echo "Make: Shelling into database workspace ..."
	@docker-compose -f docker-compose.yml exec postgres psql -U $(POSTGRESQL_USER) -W $(POSTGRES_DB)

local-db-archive-db:
	@echo "Make: Shelling into database workspace ..."
	@docker-compose -f docker-compose.yml exec postgres psql -U $(POSTGRESQL_USER) $(ARCHIVE_DB)



