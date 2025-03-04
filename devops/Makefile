-include ../.env
export $(shell sed 's/=.*//' ../.env)

.DEFAULT_GOAL := default
export GIT_LOCAL_BRANCH?=$(shell git rev-parse --abbrev-ref HEAD)
export NAMESPACE := $(or $(NAMESPACE), $$NS)
export APP_NAME := $(or $(PROJECT_NAME), sims)
export TEMPLATE_FILE_NAME := $(or $(TEMPLATE_FILE_NAME), $$FILE)
export BUILD_REF := $(or $(BUILD_REF), $(GIT_LOCAL_BRANCH))
export BUILD_NAMESPACE := $(or $(BUILD_NAMESPACE), 0c27fb-tools)
export DOMAIN := $(or $(DOMAIN), sims.studentaidbc.ca)
export DOMAIN_PREFIX := $(or $(DOMAIN_PREFIX),)
export HOST_PREFIX := $(or $(HOST_PREFIX), $$HOST_PREFIX)
export NEW_DB := $(or $(NEW_DB), $$NEW_DB)
export JOB_NAME := $(or $(JOB_NAME), $$JN)
export SITE_MINDER_LOGOUT_URL := $(or $(SITE_MINDER_LOGOUT_URL), https://logontest7.gov.bc.ca/clp-cgi/logoff.cgi)
export BYPASS_CRA_INCOME_VERIFICATION := $(or $(BYPASS_CRA_INCOME_VERIFICATION), false)
export IS_FULLTIME_ALLOWED := $(or $(IS_FULLTIME_ALLOWED), false)
export BYPASS_APPLICATION_SUBMIT_VALIDATIONS := $(or $(BYPASS_APPLICATION_SUBMIT_VALIDATIONS), false)
export SWAGGER_ENABLED := $(or ${SWAGGER_ENABLED}, true)
export APPLICATION_ARCHIVE_DAYS := $(or ${APPLICATION_ARCHIVE_DAYS}, 365)
export REDIS_PORT := $(or ${REDIS_PORT}, 6379)
export CLAMAV_PORT := $(or ${CLAMAV_PORT}, 3310)
export API_PORT := $(or ${API_PORT}, 7070)
export QUEUE_CONSUMERS_PORT := $(or ${QUEUE_CONSUMERS_PORT}, 7000)
export WORKERS_PORT := $(or ${WORKERS_PORT}, 8000)
export LOAD_TEST_GATEWAY_PORT := $(or ${LOAD_TEST_GATEWAY_PORT}, 3005)
export WEB_PORT := $(or ${WEB_PORT}, 3030)
export DB_NAME := $(or ${DB_NAME}, SIMSDB)
export DB_MIGRATIONS_BUILD_REF := $(or ${DB_MIGRATIONS_BUILD_REF}, db-migrations-${APP_NAME})
export API_BUILD_REF := $(or ${API_BUILD_REF}, api-${APP_NAME})
export WORKERS_BUILD_REF := $(or ${WORKERS_BUILD_REF}, workers-${APP_NAME})
export QUEUE_CONSUMERS_BUILD_REF := $(or ${QUEUE_CONSUMERS_BUILD_REF}, queue-consumers-${APP_NAME})
export LOAD_TEST_GATEWAY_BUILD_REF := $(or ${LOAD_TEST_GATEWAY_BUILD_REF}, load-test-gateway-${APP_NAME})
export WEB_BUILD_REF := $(or ${WEB_BUILD_REF}, web-${APP_NAME})
export FORMS_BUILD_REF := $(or ${FORMS_BUILD_REF}, forms)
export FORMIO_SOURCE_REPO_TAG := $(or $(FORMIO_SOURCE_REPO_TAG), v4.3.0)
export FORMIO_ROOT_EMAIL := $(or ${FORMIO_ROOT_EMAIL}, dev_sabc@gov.bc.ca)
export MONGODB_URI := $(or ${MONGODB_URI}, $$MONGODB_URI)
export QUEUE_PREFIX := $(or $(QUEUE_PREFIX), {sims-local})
export QUEUE_DASHBOARD_TOKEN_EXPIRATION_SECONDS := $(or $(QUEUE_DASHBOARD_TOKEN_EXPIRATION_SECONDS), 3600)

export MAX_WAIT=300 # Maximum wait time in seconds.
export WAIT_TIME=0  # Initialize wait time to zero.

define DB_MIGRATIONS
"$(HOST_PREFIX)db-migrations-$(APP_NAME)"
endef

define DB_MIGRATIONS_REPL
"$(HOST_PREFIX)db-migrations-repl-$(APP_NAME)"
endef

define DB_MIGRATIONS_JOB_NAME
"$(HOST_PREFIX)db.migrations"
endef

define API
"$(HOST_PREFIX)api-$(APP_NAME)"
endef

define WORKERS
"$(HOST_PREFIX)workers-$(APP_NAME)"
endef

define WEB
"$(HOST_PREFIX)web-$(APP_NAME)"
endef

define QUEUE_CONSUMERS
"$(HOST_PREFIX)queue-consumers-$(APP_NAME)"
endef

define LOAD_TEST_GATEWAY
"$(HOST_PREFIX)load-test-gateway-$(APP_NAME)"
endef

define SWAGGER_NAME
"$(HOST_PREFIX)swagger"
endef

define QA_DB_NAME
"QASIMSDB"
endef

define BUILD_TEMPLATE_PATH
"openshift/docker-build.yml"
endef

define HOST
"$(DOMAIN_PREFIX)$(DOMAIN)"
endef

define FORMS_NAME
"$(HOST_PREFIX)forms"
endef

define HAMONGO_DB_TEMPLATE_PATH
"openshift/database/mongo-ha.yml"
endef

define HAMONGO_DB_PARAM_PATH
"openshift/database/mongo-ha-param.yml"
endef

# Ensure DOMAIN_PREFIX do not have any ".", which would create a subdomain
# since forms has it own custom prefix appended.
define FORMS_URL
$(subst .,-,$(DOMAIN_PREFIX))forms.$(DOMAIN)
endef

define SOURCE_REPOSITORY_URL
"https://github.com/bcgov/SIMS.git"
endef

define FORMIO_SOURCE_REPO_URL
"https://github.com/formio/formio.git"
endef

define SOURCE_CONTEXT_DIR
"./sources/packages/"
endef

define rollout_and_wait
@oc -n $(NAMESPACE) rollout status $1
endef

init-oc: | print-status init-project
oc-build-db-migrations: | print-status build-db-migrations
oc-run-db-migrations: | print-status delete-db-migrations run-db-migrations wait-for-db-migrations
oc-build-api: | print-status build-api
oc-deploy-api: | print-status deploy-api
oc-build-workers: | print-status build-workers
oc-deploy-workers: | print-status deploy-workers
oc-build-queue-consumers: | print-status build-queue-consumers
oc-deploy-queue-consumers: | print-status deploy-queue-consumers
oc-build-load-test-gateway: | print-status build-load-test-gateway
oc-deploy-load-test-gateway: | print-status deploy-load-test-gateway
oc-create-db: | print-status create-db
oc-build-web: | print-status build-web
oc-deploy-web: | print-status deploy-web

oc-create-qa-api-db: | print-status create-qa-api-db

#Build and deploy forms.
oc-build-forms: | print-status build-forms
oc-deploy-ha-mongo: | print-status deploy-ha-mongo
oc-deploy-forms: | print-status deploy-forms

print-status:
	@echo " +---------------------------------------------------------+ "
	@echo " | Current Settings                                        | "
	@echo " +---------------------------------------------------------+ "
	@echo " | PROJECT:      			$(APP_NAME)"
	@echo " | BRANCH:       			$(BUILD_REF)"
	@echo " | NAMESPACE:    			$(NAMESPACE)"
	@echo " | BUILD_NAMESPACE:    $(BUILD_NAMESPACE)"
	@echo " +---------------------------------------------------------+ "
	@echo " | BUILD_REF: 	$(BUILD_REF) "
	@echo " | HOST NAME: 	$(HOST) "
	@echo " +---------------------------------------------------------+ "

init-project:
	@echo "Run initial set-up for the project, including network security\n"
	@oc -n $(NAMESPACE) process -f openshift/networkpolicy.yml -p NAMESPACE=$(NAMESPACE) | oc -n $(NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) policy add-role-to-group system:image-puller system:serviceaccounts:$(NAMESPACE)
	@oc -n $(NAMESPACE) create rolebinding github-action --clusterrole=edit --serviceaccount=$(BUILD_NAMESPACE):github-action --namespace=$(NAMESPACE)

init-secrets:
	@echo "++\n Deploy SIMS Creds Secrets $(NAMESPACE) \n++"
	@oc -n $(NAMESPACE) process -f openshift/init-secrets.yml \
		-p NAME=sims-creds \
		-p SECRET_NAME=$(SECRET_NAME) \
		-p BCeID_WEB_SERVICE_ONLINE_SERVICE_ID=$(BCeID_WEB_SERVICE_ONLINE_SERVICE_ID) \
		-p BCeID_WEB_SERVICE_REQUESTER_USER_GUID=$(BCeID_WEB_SERVICE_REQUESTER_USER_GUID) \
		-p BCeID_WEB_SERVICE_AUTH_USER_NAME=$(BCeID_WEB_SERVICE_AUTH_USER_NAME) \
		-p BCeID_WEB_SERVICE_AUTH_USER_PASSWORD=$(BCeID_WEB_SERVICE_AUTH_USER_PASSWORD) \
		-p CRA_REQUEST_FOLDER=$(CRA_REQUEST_FOLDER) \
		-p CRA_RESPONSE_FOLDER=$(CRA_RESPONSE_FOLDER) \
		-p CRA_PROGRAM_AREA_CODE=$(CRA_PROGRAM_AREA_CODE) \
		-p CRA_ENVIRONMENT_CODE=$(CRA_ENVIRONMENT_CODE) \
		-p ATBC_USERNAME=$(ATBC_USERNAME) \
		-p ATBC_PASSWORD=$(ATBC_PASSWORD) \
		-p ATBC_APP=$(ATBC_APP) \
		-p ESDC_REQUEST_FOLDER=$(ESDC_REQUEST_FOLDER) \
		-p ESDC_RESPONSE_FOLDER=$(ESDC_RESPONSE_FOLDER) \
		-p ESDC_ENVIRONMENT_CODE=$(ESDC_ENVIRONMENT_CODE) \
		-p SFAS_RECEIVE_FOLDER=$(SFAS_RECEIVE_FOLDER) \
		-p SFAS_SEND_FOLDER=$(SFAS_SEND_FOLDER) \
		-p SIMS_DB_NAME=$(SIMS_DB_NAME) \
		-p INSTITUTION_REQUEST_FOLDER=$(INSTITUTION_REQUEST_FOLDER) \
		-p INSTITUTION_RESPONSE_FOLDER=$(INSTITUTION_RESPONSE_FOLDER) \
		-p GC_NOTIFY_URL=$(GC_NOTIFY_URL) \
		-p GC_NOTIFY_API_KEY=$(GC_NOTIFY_API_KEY) \
		-p ZEEBE_ADDRESS=$(ZEEBE_ADDRESS) \
		-p ZEEBE_CLIENT_ID=$(ZEEBE_CLIENT_ID) \
		-p ZEEBE_CLIENT_SECRET=$(ZEEBE_CLIENT_SECRET) \
		-p CAMUNDA_OAUTH_URL=$(CAMUNDA_OAUTH_URL) \
		-p ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS=$(ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS) \
		-p QUEUE_DASHBOARD_TOKEN_SECRET=$(QUEUE_DASHBOARD_TOKEN_SECRET) \
		-p QUEUE_DASHBOARD_TOKEN_EXPIRATION_SECONDS=$(QUEUE_DASHBOARD_TOKEN_EXPIRATION_SECONDS) \
		-p CAS_BASE_URL=$(CAS_BASE_URL) \
		-p CAS_CLIENT_ID=$(CAS_CLIENT_ID) \
		-p CAS_CLIENT_SECRET=$(CAS_CLIENT_SECRET) \
		-p S3_ACCESS_KEY_ID=$(S3_ACCESS_KEY_ID) \
		-p S3_SECRET_ACCESS_KEY=$(S3_SECRET_ACCESS_KEY) \
		-p S3_ENDPOINT=$(S3_ENDPOINT) \
		-p S3_DEFAULT_BUCKET=$(S3_DEFAULT_BUCKET) \
		-p S3_REGION=$(S3_REGION) \
		| oc -n $(NAMESPACE) apply -f -

init-zone-b-sftp-secret:
	test -n $(INIT_ZONE_B_SFTP_SERVER)
	test -n $(INIT_ZONE_B_SFTP_SERVER_PORT)
	test -n $(INIT_ZONE_B_SFTP_USER_NAME)
	test -n $(INIT_ZONE_B_SFTP_PRIVATE_KEY_PASSPHRASE)
	@oc create secret generic zone-b-sftp -n $(NAMESPACE) \
		--from-literal=server=$(INIT_ZONE_B_SFTP_SERVER) \
		--from-literal=server-port=$(INIT_ZONE_B_SFTP_SERVER_PORT) \
		--from-literal=user-name=$(INIT_ZONE_B_SFTP_USER_NAME) \
		--from-literal=private-key-passphrase=$(INIT_ZONE_B_SFTP_PRIVATE_KEY_PASSPHRASE) \
		--from-file=private-key=./openshift/zone-b-private-key.cer \
		--dry-run=client -o yaml | oc apply -f -

init-artifactory-secret-credential:
	test -n $(NAMESPACE)
	@oc create secret docker-registry artifactory-secret-credential -n $(NAMESPACE) \
    	--docker-server=artifacts.developer.gov.bc.ca \
    	--docker-username=$(USERNAME) \
    	--docker-password=$(PASSWORD) \
    	--docker-email=$(USERNAME)@$(NAMESPACE).local
	@oc secrets link default artifactory-secret-credential
	@oc secrets link builder artifactory-secret-credential

build-db-migrations:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(DB_MIGRATIONS_BUILD_REF)"
	@echo "+\n++ BUILDING DB migrations with tag: $(BUILD_REF)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(BUILD_TEMPLATE_PATH) -p TAG=$(BUILD_REF) -p SOURCE_REPOSITORY_REF=$(BUILD_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)backend -p DOCKER_FILE_PATH=apps/db-migrations/Dockerfile -p NAME=$(DB_MIGRATIONS_BUILD_REF) | oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(DB_MIGRATIONS_BUILD_REF) --wait

build-api:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(API_BUILD_REF)"
	@echo "+\n++ BUILDING API with tag: $(BUILD_REF)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(BUILD_TEMPLATE_PATH) -p TAG=$(BUILD_REF) -p SOURCE_REPOSITORY_REF=$(BUILD_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)backend -p DOCKER_FILE_PATH=apps/api/Dockerfile -p NAME=$(API_BUILD_REF) | oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(API_BUILD_REF) --wait

build-workers:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(WORKERS_BUILD_REF)"
	@echo "+\n++ BUILDING WORKERS with tag: $(BUILD_REF)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(BUILD_TEMPLATE_PATH) -p TAG=$(BUILD_REF) -p SOURCE_REPOSITORY_REF=$(BUILD_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)backend -p DOCKER_FILE_PATH=apps/workers/Dockerfile -p NAME=$(WORKERS_BUILD_REF) | oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(WORKERS_BUILD_REF) --wait

build-queue-consumers:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(QUEUE_CONSUMERS_BUILD_REF)"
	@echo "+\n++ BUILDING QUEUE_CONSUMERS with tag: $(BUILD_REF)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(BUILD_TEMPLATE_PATH) -p TAG=$(BUILD_REF) -p SOURCE_REPOSITORY_REF=$(BUILD_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)backend -p DOCKER_FILE_PATH=apps/queue-consumers/Dockerfile -p NAME=$(QUEUE_CONSUMERS_BUILD_REF) | oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(QUEUE_CONSUMERS_BUILD_REF) --wait

build-load-test-gateway:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(LOAD_TEST_GATEWAY_BUILD_REF)"
	@echo "+\n++ BUILDING LOAD_TEST_GATEWAY with tag: $(BUILD_REF)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(BUILD_TEMPLATE_PATH) -p TAG=$(BUILD_REF) -p SOURCE_REPOSITORY_REF=$(BUILD_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)backend -p DOCKER_FILE_PATH=apps/load-test-gateway/Dockerfile -p NAME=$(LOAD_TEST_GATEWAY_BUILD_REF) | oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(LOAD_TEST_GATEWAY_BUILD_REF) --wait

build-web:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(WEB_BUILD_REF)"
	@echo "+\n++ BUILDING WEB with tag: $(BUILD_REF)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(BUILD_TEMPLATE_PATH) -p TAG=$(BUILD_REF) -p SOURCE_REPOSITORY_REF=$(BUILD_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)web -p NAME=$(WEB_BUILD_REF) | oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(WEB_BUILD_REF) --wait

init-redis:
	@echo "++\n Init Redis in $(NAMESPACE) \n++"
	@oc -n $(NAMESPACE) process -f openshift/database/redis-secrets.yml | oc -n $(NAMESPACE) apply -f -

deploy-redis:
	@oc -n $(NAMESPACE) process -f openshift/database/redis-ha-deploy.yml -p IMAGE_NAME="redis" -p IMAGE_TAG="6.2.7-alpine" -p IMAGE_REGISTRY="artifacts.developer.gov.bc.ca/docker-remote" | oc -n $(NAMESPACE) apply -f -

# Command to initialize the redis cluster.
# Make sure that all the redis pods are up and running before initializing the cluster.
init-redis-cluster:
	REDIS_PASSWORD=$$(oc get secret -n $(NAMESPACE) redis-creds -o jsonpath='{.data.password}' | base64 -d); \
	REDIS_NODES=$$(oc get pods -n $(NAMESPACE) -l app=redis -o jsonpath='{range .items[*]}{.status.podIP}:$(REDIS_PORT) ' | sed 's/ :$(REDIS_PORT) $$/ /'); \
	oc exec -n $(NAMESPACE) -it redis-0 -- redis-cli -a $$REDIS_PASSWORD --cluster create $$REDIS_NODES --cluster-replicas 1

# Command to tell one Redis node to connect to another node and join the cluster.
# This is typically done when you are setting up a Redis Cluster or adding new nodes to an existing cluster to ensure they are aware of each other and can communicate effectively.
redis-cluster-meet:
	REDIS_PASSWORD=$$(oc get secret -n $(NAMESPACE) redis-creds -o jsonpath='{.data.password}' | base64 -d); \
  oc get pods -n $(NAMESPACE) -l app=redis -o jsonpath='{range.items[*]}{.status.podIP} $(REDIS_PORT) {end}' | xargs -n2 oc exec -n $(NAMESPACE) -it redis-0 -- redis-cli -a $$REDIS_PASSWORD -c CLUSTER MEET

run-db-migrations:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(API_SECRET_NAME)"
	test -n "$(DB_MIGRATIONS_BUILD_REF)"
	test -n "$(BUILD_REF)"
	test -n "$(DB_MIGRATIONS)"
	@echo "+\n++ Deploying DB_MIGRATIONS with tag: $(BUILD_REF)\n+"
	@oc -n $(NAMESPACE) process -f openshift/db-migrations-job.yml \
		-p NAME=$(DB_MIGRATIONS) \
		-p BUILD_NAMESPACE=$(BUILD_NAMESPACE) \
		-p API_SECRET_NAME=$(API_SECRET_NAME) \
		-p IMAGE_STREAM_TAG="$(DB_MIGRATIONS_BUILD_REF):$(BUILD_REF)" \
		-p BUILD_TAG=$(BUILD_REF) \
		-p JOB_NAME=$(DB_MIGRATIONS_JOB_NAME) \
		| oc -n $(NAMESPACE) apply -f -

wait-for-db-migrations:
	while [ "$$(oc -n $(NAMESPACE) get job $(DB_MIGRATIONS_JOB_NAME) -o=jsonpath='{.status.conditions[?(@.type=="Complete")].status}' || echo "None")" != "True" ] && [ "$$WAIT_TIME" -lt "$$MAX_WAIT" ]; do sleep 5; WAIT_TIME=$$((WAIT_TIME+5)); done
	if [ "$$(oc -n $(NAMESPACE) get job $(DB_MIGRATIONS_JOB_NAME) -o=jsonpath='{.status.conditions[?(@.type=="Complete")].status}' || echo "None")" != "True" ]; then echo "Error: Job $(DB_MIGRATIONS_JOB_NAME) failed to complete within the specified timeout"; exit 1; fi

delete-db-migrations:
	@if [ -n "$(shell oc -n $(NAMESPACE) get job $(DB_MIGRATIONS_JOB_NAME) -o name 2>/dev/null)" ]; then \
		oc -n $(NAMESPACE) delete job $(DB_MIGRATIONS_JOB_NAME); \
			echo "Job deleted."; \
	else \
		echo "Job not found."; \
	fi

# This deployment reuses the build already in place for db-migrations
# overriding the docker entry point command to run the db-migrations REPL.
deploy-db-migrations-repl:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(DB_MIGRATIONS_SECRET_NAME)"
	test -n "$(HOST_PREFIX)"
	test -n "$(DB_MIGRATIONS_BUILD_REF)"
	test -n "$(BUILD_REF)"
	test -n "$(DB_MIGRATIONS_REPL)"
	@echo "+\n++ Deploying DB migrations REPL with tag: $(BUILD_REF)\n+"
	@oc -n $(NAMESPACE) process -f openshift/db-migrations-repl.yml \
		-p NAME=$(DB_MIGRATIONS_REPL) \
		-p DB_MIGRATIONS_SECRET_NAME=$(DB_MIGRATIONS_SECRET_NAME) \
		-p BUILD_NAMESPACE=$(BUILD_NAMESPACE) \
		-p IMAGE_STREAM_TAG="$(DB_MIGRATIONS_BUILD_REF):$(BUILD_REF)" \
		-p BUILD_TAG=$(BUILD_REF) \
		| oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,deployment/$(DB_MIGRATIONS_REPL))

deploy-api:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(KEYCLOAK_REALM)"
	test -n "$(KEYCLOAK_AUTH_URL)"
	test -n "$(BCeID_WEB_SERVICE_WSDL)"
	test -n "$(FORMS_SECRET_NAME)"
	test -n "$(SITE_MINDER_LOGOUT_URL)"
	test -n "$(ATBC_LOGIN_ENDPOINT)"
	test -n "$(ATBC_ENDPOINT)"
	test -n "$(API)"
	test -n "$(API_SECRET_NAME)"
	test -n "$(HOST)"
	test -n "$(SWAGGER_NAME)"
	test -n "$(QUEUE_PREFIX)"
	test -n "$(API_PORT)"
	test -n "$(IS_FULLTIME_ALLOWED)"
	test -n "$(APPLICATION_ARCHIVE_DAYS)"
	@echo "+\n++ Deploying API with tag: $(BUILD_REF)\n+"
	@oc -n $(NAMESPACE) process -f openshift/api-deploy.yml \
		-p NAME=$(API) \
		-p API_SECRET_NAME=$(API_SECRET_NAME) \
		-p HOST_NAME=$(HOST) \
		-p PORT=$(API_PORT) \
		-p BUILD_NAMESPACE=$(BUILD_NAMESPACE) \
		-p IMAGE_STREAM_TAG="$(API_BUILD_REF):$(BUILD_REF)" \
		-p KEYCLOAK_REALM=$(KEYCLOAK_REALM) \
		-p KEYCLOAK_AUTH_URL=$(KEYCLOAK_AUTH_URL) \
		-p BCeID_WEB_SERVICE_WSDL=$(BCeID_WEB_SERVICE_WSDL) \
		-p FORMS_SECRET_NAME=$(FORMS_SECRET_NAME) \
		-p BUILD_TAG=$(BUILD_REF) \
		-p SITE_MINDER_LOGOUT_URL=$(SITE_MINDER_LOGOUT_URL) \
		-p ATBC_LOGIN_ENDPOINT=$(ATBC_LOGIN_ENDPOINT) \
		-p ATBC_ENDPOINT=$(ATBC_ENDPOINT) \
		-p BYPASS_APPLICATION_SUBMIT_VALIDATIONS=$(BYPASS_APPLICATION_SUBMIT_VALIDATIONS) \
		-p IS_FULLTIME_ALLOWED=$(IS_FULLTIME_ALLOWED) \
		-p SWAGGER_ENABLED=$(SWAGGER_ENABLED) \
		-p SWAGGER_NAME=$(SWAGGER_NAME) \
		-p QUEUE_PREFIX=$(QUEUE_PREFIX) \
		-p APPLICATION_ARCHIVE_DAYS=$(APPLICATION_ARCHIVE_DAYS) \
		-p MAXIMUM_IDLE_TIME_FOR_WARNING_STUDENT=$(MAXIMUM_IDLE_TIME_FOR_WARNING_STUDENT) \
		-p MAXIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER=$(MAXIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER) \
		-p MAXIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION=$(MAXIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION) \
		-p MAXIMUM_IDLE_TIME_FOR_WARNING_AEST=$(MAXIMUM_IDLE_TIME_FOR_WARNING_AEST) \
		-p APP_ENV=$(APP_ENV) \
		-p TLS_CERTIFICATE=$(TLS_CERTIFICATE) \
		-p TLS_KEY=$(TLS_KEY) \
		-p TLS_CA_CERTIFICATE=$(TLS_CA_CERTIFICATE) \
		-p ALLOW_BETA_USERS_ONLY=$(ALLOW_BETA_USERS_ONLY) \
		-p QUEUE_DASHBOARD_BASE_URL=https://$(HOST) \
		| oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,deployment/$(API))

deploy-workers:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(WORKERS_BUILD_REF)"
	test -n "$(WORKERS_SECRET_NAME)"
	test -n "$(WORKERS)"
	test -n "$(WORKERS_PORT)"
	test -n "$(BYPASS_CRA_INCOME_VERIFICATION)"
	@echo "+\n++ Deploying Workers with tag: $(BUILD_REF)\n+"
	@oc -n $(NAMESPACE) process -f openshift/workers-deploy.yml \
		-p NAME=$(WORKERS) \
		-p WORKERS_SECRET_NAME=$(WORKERS_SECRET_NAME) \
		-p BUILD_NAMESPACE=$(BUILD_NAMESPACE) \
		-p PORT=$(WORKERS_PORT) \
		-p IMAGE_STREAM_TAG="$(WORKERS_BUILD_REF):$(BUILD_REF)" \
		-p BUILD_TAG=$(BUILD_REF) \
		-p BYPASS_CRA_INCOME_VERIFICATION=$(BYPASS_CRA_INCOME_VERIFICATION) \
		-p DISABLE_ORM_CACHE=$(DISABLE_ORM_CACHE) \
		| oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,deployment/$(WORKERS))

deploy-queue-consumers:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(QUEUE_CONSUMERS_BUILD_REF)"
	test -n "$(QUEUE_CONSUMERS_SECRET_NAME)"
	test -n "$(QUEUE_CONSUMERS)"
	test -n "$(QUEUE_CONSUMERS_PORT)"
	test -n "$(QUEUE_PREFIX)"
	test -n "$(ATBC_LOGIN_ENDPOINT)"
	test -n "$(ATBC_ENDPOINT)"
	test -n "$(APPLICATION_ARCHIVE_DAYS)"
	@echo "+\n++ Deploying Queues with tag: $(BUILD_REF)\n+"
	@oc -n $(NAMESPACE) process -f openshift/queue-consumers-deploy.yml \
		-p NAME=$(QUEUE_CONSUMERS) \
		-p QUEUE_CONSUMERS_SECRET_NAME=$(QUEUE_CONSUMERS_SECRET_NAME) \
		-p BUILD_NAMESPACE=$(BUILD_NAMESPACE) \
		-p IMAGE_STREAM_TAG="$(QUEUE_CONSUMERS_BUILD_REF):$(BUILD_REF)" \
		-p BUILD_TAG=$(BUILD_REF) \
		-p PORT=$(QUEUE_CONSUMERS_PORT) \
		-p CLAMAV_PORT=$(CLAMAV_PORT) \
		-p HOST_NAME=$(HOST) \
		-p QUEUE_PREFIX=$(QUEUE_PREFIX) \
		-p ATBC_LOGIN_ENDPOINT=$(ATBC_LOGIN_ENDPOINT) \
		-p ATBC_ENDPOINT=$(ATBC_ENDPOINT) \
		-p APPLICATION_ARCHIVE_DAYS=$(APPLICATION_ARCHIVE_DAYS) \
		-p IS_FULLTIME_ALLOWED=$(IS_FULLTIME_ALLOWED) \
		-p TLS_CERTIFICATE=$(TLS_CERTIFICATE) \
		-p TLS_KEY=$(TLS_KEY) \
		-p TLS_CA_CERTIFICATE=$(TLS_CA_CERTIFICATE) \
		| oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,deployment/$(QUEUE_CONSUMERS))

deploy-load-test-gateway:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(LOAD_TEST_GATEWAY_BUILD_REF)"
	test -n "$(LOAD_TEST_GATEWAY_SECRET_NAME)"
	test -n "$(LOAD_TEST_GATEWAY)"
	test -n "$(LOAD_TEST_GATEWAY_PORT)"
	test -n "$(KEYCLOAK_AUTH_URL)"
	test -n "$(KEYCLOAK_REALM)"
	@echo "+\n++ Deploying Load test gateway with tag: $(BUILD_REF)\n+"
	@oc -n $(NAMESPACE) process -f openshift/load-test-gateway-deploy.yml \
		-p NAME=$(LOAD_TEST_GATEWAY) \
		-p LOAD_TEST_GATEWAY_SECRET_NAME=$(LOAD_TEST_GATEWAY_SECRET_NAME) \
		-p BUILD_NAMESPACE=$(BUILD_NAMESPACE) \
		-p IMAGE_STREAM_TAG="$(LOAD_TEST_GATEWAY_BUILD_REF):$(BUILD_REF)" \
		-p BUILD_TAG=$(BUILD_REF) \
		-p PORT=$(LOAD_TEST_GATEWAY_PORT) \
		-p HOST_NAME=$(HOST) \
		-p KEYCLOAK_AUTH_URL=$(KEYCLOAK_AUTH_URL) \
		-p KEYCLOAK_REALM=$(KEYCLOAK_REALM) \
		-p TLS_CERTIFICATE=$(TLS_CERTIFICATE) \
		-p TLS_KEY=$(TLS_KEY) \
		-p TLS_CA_CERTIFICATE=$(TLS_CA_CERTIFICATE) \
		| oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,deployment/$(LOAD_TEST_GATEWAY))

deploy-web:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(WEB)"
	test -n "$(WEB_BUILD_REF)"
	test -n "$(BUILD_REF)"
	test -n "$(WEB_PORT)"
	@echo "+\n++ Deploying WEB with tag: $(BUILD_REF)\n+"
	@oc -n $(NAMESPACE) process -f openshift/web-deploy.yml \
	-p NAME=$(WEB) \
	-p PORT=$(WEB_PORT) \
	-p HOST_NAME=$(HOST) \
	-p BUILD_NAMESPACE=$(BUILD_NAMESPACE) \
	-p IMAGE_STREAM_TAG="$(WEB_BUILD_REF):$(BUILD_REF)"  \
	-p TLS_CERTIFICATE=$(TLS_CERTIFICATE) \
	-p TLS_KEY=$(TLS_KEY) \
	-p TLS_CA_CERTIFICATE=$(TLS_CA_CERTIFICATE) \
	| oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,deployment/$(WEB))

deploy-ha-mongo:
	test -n "$(NAMESPACE)"
	@oc -n $(NAMESPACE) process -f $(HAMONGO_DB_TEMPLATE_PATH) --param-file=$(HAMONGO_DB_PARAM_PATH) | oc -n $(NAMESPACE) apply -f -

build-forms:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(SOURCE_CONTEXT_DIR)"
	test -n "$(SOURCE_REPOSITORY_URL)"
	test -n "$(FORMIO_SOURCE_REPO_URL)"
	test -n "$(FORMIO_SOURCE_REPO_TAG)"
	@echo "+\n++ BUILDING $(FORMS_BUILD_REF) DIR: $(SOURCE_CONTEXT_DIR)forms BUILD_TAG:$(FORMIO_SOURCE_REPO_TAG)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f openshift/forms-build.yml -p NAME=$(FORMS_BUILD_REF) -p TAG=$(FORMIO_SOURCE_REPO_TAG) -p FORMIO_SOURCE_REPO_URL=$(FORMIO_SOURCE_REPO_URL) -p FORMIO_SOURCE_REPO_TAG=$(FORMIO_SOURCE_REPO_TAG) -p SOURCE_REPOSITORY_URL=$(SOURCE_REPOSITORY_URL) -p SOURCE_REPOSITORY_REF=$(BUILD_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)forms| oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(FORMS_BUILD_REF) --wait

deploy-forms:
	test -n "$(NAMESPACE)"
	test -n "$(FORMS_NAME)"
	test -n "$(FORMS_URL)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(FORMIO_SOURCE_REPO_TAG)"
	test -n "$(FORMIO_ROOT_EMAIL)"
	test -n "$(MONGODB_URI)"
	@echo "+\n++ Deploying forms with tag: $(FORMIO_SOURCE_REPO_TAG)\n+"
	@oc -n $(NAMESPACE) process -f openshift/forms-deploy.yml \
	-p NAME=$(FORMS_NAME) \
	-p FORMS_URL=$(FORMS_URL) \
	-p TOOLS_NAMESPACE=$(BUILD_NAMESPACE) \
	-p IMAGE_STREAM_TAG="$(FORMS_BUILD_REF):$(FORMIO_SOURCE_REPO_TAG)" \
	-p FORMIO_ROOT_EMAIL=$(FORMIO_ROOT_EMAIL) \
	-p FORMIO_ROOT_PASSWORD=$(FORMIO_ROOT_PASSWORD) \
	-p MONGODB_URI=$(MONGODB_URI) \
	-p TLS_CERTIFICATE=$(TLS_CERTIFICATE) \
	-p TLS_KEY=$(TLS_KEY) \
	-p TLS_CA_CERTIFICATE=$(TLS_CA_CERTIFICATE) \
	| oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,deployment/$(FORMS_NAME))

# Remove redis and resources including secrets from openshift namespace.
delete-redis:
	@echo "+\n++ Removing redis and resources on $(NAMESPACE)\n+"
	@oc delete -n $(NAMESPACE) all,rc,svc,dc,route,pvc,secret,configmap,sa -l app=redis

update-sysdig-team:
	@echo "Updating Sysdig Team for license plate 0c27fb.\n"
	@oc project 0c27fb-tools
	@oc process -f openshift/sysdig-team.yml -p LICENSE_PLATE=0c27fb | oc apply -f -
	@echo "Updating Sysdig Team for license plate a6ef19.\n"
	@oc project a6ef19-tools
	@oc process -f openshift/sysdig-team.yml -p LICENSE_PLATE=a6ef19 | oc apply -f -
