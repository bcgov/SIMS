-include ../../.env
-include .env-e2e-tests

export $(shell sed 's/=.*//' ../../.env)
# Override values from the global .env file.
export $(shell sed 's/=.*//' .env-e2e-tests)

# Fulltime Allowed
export IS_FULLTIME_ALLOWED := $(or $(IS_FULLTIME_ALLOWED), true)

# Logged Out due to inactivity
export MAXIMUM_IDLE_TIME_FOR_WARNING_STUDENT := $(MAXIMUM_IDLE_TIME_FOR_WARNING_STUDENT)
export MAXIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER := $(MAXIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER)
export MAXIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION :=$(MAXIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION)
export MAXIMUM_IDLE_TIME_FOR_WARNING_AEST := $(MAXIMUM_IDLE_TIME_FOR_WARNING_AEST)

backend-unit-tests:
	@cd ../packages/backend && npm i && npm run test:cov

e2e-tests-api:
	@echo "+\n++ Make: Starting containers for API E2E tests \n+"
	@docker compose run --name api-e2e-$(BUILD_REF) api npm run test:e2e:api
	@mkdir -p coverage/api
	@docker cp api-e2e-$(BUILD_REF):app/apps/api/coverage/clover.xml coverage/api
	@docker rm api-e2e-$(BUILD_REF)
	@docker compose down --rmi all -v

e2e-tests-workers:
	@echo "+\n++ Make: Starting containers for Workers E2E tests \n+"
	@docker compose run --name workers-e2e-$(BUILD_REF) workers npm run test:e2e:workers
	@mkdir -p coverage/workers
	@docker cp workers-e2e-$(BUILD_REF):app/apps/workers/coverage/clover.xml coverage/workers
	@docker rm workers-e2e-$(BUILD_REF)
	@docker compose down --rmi all -v
	
e2e-tests-queue-consumers:
	@echo "+\n++ Make: Starting containers for Queue Consumers E2E tests \n+"
	@docker compose run --name queue-consumers-e2e-$(BUILD_REF) queue-consumers npm run test:e2e:queue-consumers
	@mkdir -p coverage/queue-consumers
	@docker cp queue-consumers-e2e-$(BUILD_REF):app/apps/queue-consumers/coverage/clover.xml coverage/queue-consumers
	@docker rm queue-consumers-e2e-$(BUILD_REF)
	@docker compose down --rmi all -v

e2e-tests-workflow:
	@echo "+\n++ Make: Starting containers for camunda workflow E2E tests \n+"
	@docker compose -f workflow-docker-compose.yml run --name workflow-e2e --rm workflow npm run test:e2e:workflow
	@docker compose -f workflow-docker-compose.yml down
