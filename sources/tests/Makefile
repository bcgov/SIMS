-include ../../.env
-include .env-e2e-tests

export $(shell sed 's/=.*//' ../../.env)
# Override values from the global .env file.
export $(shell sed 's/=.*//' .env-e2e-tests)

backend-unit-tests:
	@cd ../packages/backend && npm i && npm run test:cov

e2e-tests-api:
	@echo "+\n++ Make: Starting containers for API E2E tests...ON TESTS \n+"
	@docker-compose run --name api-e2e-$(BUILD_REF) --rm api npm run test:e2e:api
	@docker-compose down --rmi all -v

e2e-tests-workers:
	@echo "+\n++ Make: Starting containers for Workers E2E tests...ON TESTS \n+"
	@docker-compose run --name workers-e2e --rm workers npm run test:e2e:workers
	@docker-compose down --rmi all -v

e2e-tests-queue-consumers:
	@echo "+\n++ Make: Starting containers for Queue Consumers E2E tests...\n+"
	@docker-compose run --name queue-consumers-e2e-$(BUILD_REF) --rm queue-consumers npm run test:e2e:queue-consumers
	@docker-compose down --rmi all -v

e2e-tests-workflow:
	@echo "+\n++ Make: Starting containers for camunda workflow E2E tests...ON TESTS \n+"
	@docker-compose -f camunda-docker-compose-test.yml run --name workflow-e2e --rm workflow npm run docker:test:e2e:workflow
	@docker-compose -f camunda-docker-compose-test.yml down
