-include ../../.env
-include .env-e2e-tests

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
#Institution Integration
export INSTITUTION_REQUEST_FOLDER := $(or $(INSTITUTION_REQUEST_FOLDER), Institution-Request)

export $(shell sed 's/=.*//' ../../.env)
# Override values from the global .env file.
export $(shell sed 's/=.*//' .env-e2e-tests)

backend-unit-tests:
	@cd ../packages/backend && npm i && npm run test:cov

e2e-tests-api:
	@echo "+\n++ Make: Starting containers for API E2E tests...ON TESTS \n+"
	@docker-compose run --build --name api-e2e-$(BUILD_REF) --rm api npm run test:e2e:api
	@docker-compose down --rmi all -v

e2e-tests-workers:
	@echo "+\n++ Make: Starting containers for Workers E2E tests...ON TESTS \n+"
	@docker-compose -f docker-compose.yml run --name workers-e2e --rm workers npm run test:e2e:workers
	@docker-compose -f docker-compose.yml down --rmi all -v

e2e-tests-queue-consumers:
	@echo "+\n++ Make: Starting containers for Queue Consumers E2E tests...\n+"
	@docker-compose run --build --name queue-consumers-e2e-$(BUILD_REF) --rm queue-consumers npm run test:e2e:queue-consumers
	@docker-compose down --rmi all -v
