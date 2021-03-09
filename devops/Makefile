-include ../.env
export $(shell sed 's/=.*//' ../.env)

.DEFAULT_GOAL := default
export GIT_LOCAL_BRANCH?=$(shell git rev-parse --abbrev-ref HEAD)
export NAMESPACE := $(or $(NAMESPACE), $$NS)
export APP_NAME := $(or $(PROJECT_NAME), sims)
export BUILD_ID := $(or $(BUILD_ID), 1)
export TEMPLATE_FILE_NAME := $(or $(TEMPLATE_FILE_NAME), $$FILE)
export BUILD_REF := $(or $(BUILD_REF), $(GIT_LOCAL_BRANCH))
export BUILD_NAMESPACE := $(or $(BUILD_NAMESPACE), 0c27fb-tools)
export DOMAIN := $(or $(DOMAIN), apps.silver.devops.gov.bc.ca)
export HOST_PREFIX := $(or $(HOST_PREFIX), dev-)
export NEW_DB := $(or $(NEW_DB), $$NEW_DB)
export JOB_NAME := $(or $(JOB_NAME), $$JN)

define BUILD_TAG
"$(BUILD_REF)-${BUILD_ID}"
endef

define BUILD_TEMPLATE_PATH
"openshift/docker-build.yml"
endef

define API
"api-$(APP_NAME)"
endef

define Web
"web-$(APP_NAME)"
endef

define HOST
"$(HOST_PREFIX)aest-sims.$(DOMAIN)"
endef

define DB_SERVICE_NAME
"patroni-master"
endef

define DB_NAME
"SIMSDB"
endef

define rollout_and_wait
@oc -n $(NAMESPACE) rollout status $1
endef


init-oc: | print-status init-project
oc-build-patroni: | print-status build-patroni
oc-deploy-patroni: | print-status deploy-patroni
oc-build-api: | print-status build-api
oc-deploy-api: | print-status deploy-api
oc-create-db: | print-status create-db
oc-build-web: | print-status build-web
oc-deploy-web: | print-status deploy-web

print-status:
	@echo " +---------------------------------------------------------+ "
	@echo " | Current Settings                                        | "
	@echo " +---------------------------------------------------------+ "
	@echo " | PROJECT:      			$(APP_NAME)"
	@echo " | BRANCH:       			$(BUILD_REF)"
	@echo " | NAMESPACE:    			$(NAMESPACE)"
	@echo " | BUILD_NAMESPACE:    $(BUILD_NAMESPACE)"
	@echo " +---------------------------------------------------------+ "
	@echo " | BUILD_ID: 	$(BUILD_ID) "
	@echo " | BUILD_TAG: 	$(BUILD_TAG) "
	@echo " | HOST NAME: 	$(HOST) "
	@echo " +---------------------------------------------------------+ "

init-project:
	@echo "Run initial set-up for the project, including network security\n" 
	@oc -n $(NAMESPACE) process -f openshift/networkpolicy.yml -p NAMESPACE=$(NAMESPACE) | oc -n $(NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) policy add-role-to-group system:image-puller system:serviceaccounts:$(NAMESPACE)

build-patroni:
	@oc -n $(BUILD_NAMESPACE) process -f $(BUILD_TEMPLATE_PATH)  -p NAME=patroni -p TAG="12-latest" -p BASE_IMAGE_NAME=postgres -p BASE_IMAGE_TAG="12" -p SOURCE_REPOSITORY_URL="https://github.com/BCDevOps/platform-services.git" -p SOURCE_REPOSITORY_REF="master" -p SOURCE_CONTEXT_DIR="apps/pgsql/patroni/docker" | oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/patroni --wait

init-api:
	@echo "++\n Init Api in $(NAMESPACE) \n++"
	test -n $(API_INIT_BCeID_WEB_SERVICE_ONLINE_SERVICE_ID)
	test -n $(API_INIT_BCeID_WEB_SERVICE_REQUESTER_USER_GUID)
	test -n $(API_INIT_BCeID_WEB_SERVICE_AUTH_USER_NAME)
	test -n $(API_INIT_REQ_BCeID_WEB_SERVICE_AUTH_USER_PASSWORD)
	@oc -n $(NAMESPACE) process -f openshift/api-pre-req.yml -p NAME=api -p BCeID_WEB_SERVICE_ONLINE_SERVICE_ID=$(API_INIT_BCeID_WEB_SERVICE_ONLINE_SERVICE_ID) -p BCeID_WEB_SERVICE_REQUESTER_USER_GUID=$(API_INIT_BCeID_WEB_SERVICE_REQUESTER_USER_GUID) -p BCeID_WEB_SERVICE_AUTH_USER_NAME=$(API_INIT_BCeID_WEB_SERVICE_AUTH_USER_NAME) -p BCeID_WEB_SERVICE_AUTH_USER_PASSWORD=$(API_INIT_REQ_BCeID_WEB_SERVICE_AUTH_USER_PASSWORD) | oc -n $(NAMESPACE) apply -f -

build-api:
	test -n "$(BUILD_REF)"
	test -n "$(BUILD_NAMESPACE)"
	@echo "+\n++ BUILDING API with tag: $(BUILD_TAG)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(BUILD_TEMPLATE_PATH) -p TAG=$(BUILD_TAG) -p SOURCE_REPOSITORY_REF=$(BUILD_REF) -p BASE_IMAGE_NAME="nodejs-12" -p BASE_IMAGE_TAG="1" -p BASE_IMAGE_REPO="registry.access.redhat.com/ubi8/" -p SOURCE_CONTEXT_DIR=sources/packages/api -p NAME=$(API) | oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(API) --wait

build-web:
	test -n "$(BUILD_REF)"
	test -n "$(BUILD_NAMESPACE)"
	@echo "+\n++ BUILDING Web with tag: $(BUILD_TAG)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(BUILD_TEMPLATE_PATH) -p TAG=$(BUILD_TAG) -p SOURCE_REPOSITORY_REF=$(BUILD_REF) -p BASE_IMAGE_NAME="nodejs-12" -p BASE_IMAGE_TAG="1" -p BASE_IMAGE_REPO="registry.access.redhat.com/ubi8/" -p SOURCE_CONTEXT_DIR=sources/packages/web -p NAME=$(Web) | oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(Web) --wait

init-patroni:
	@echo "++\n Init Patroni in $(NAMESPACE) \n++"
	@oc -n $(NAMESPACE) process -f openshift/patroni-pre-req.yml | oc -n $(NAMESPACE) apply -f -

deploy-patroni:
	@oc -n $(NAMESPACE) process -f openshift/patroni-deploy.yml -p BUILD_NAMESPACE=$(BUILD_NAMESPACE) -p IMAGE_STREAM_TAG=patroni:12-latest | oc -n $(NAMESPACE) apply -f -

create-db:
	test -n $(DB_NAME)
	test -n $(NAMESPACE)
	@echo "+\n++ Creating DB ($(DB_NAME)) in $(NAMESPACE) patroni db cluster"
	@oc -n $(NAMESPACE) process -f openshift/createdb-job.yml -p DB_NAME=$(DB_NAME) -p BUILD_NAMESPACE=$(BUILD_NAMESPACE) -p JOB_NAME=main | oc -n $(NAMESPACE) apply -f -

create-new-db:
	test -n $(NEW_DB)
	test -n $(NAMESPACE)
	test -n $(JOB_NAME)
	@echo "+\n++ Creating DB ($(NEW_DB)) in $(NAMESPACE) patroni db cluster"
	@oc -n $(NAMESPACE) process -f openshift/createdb-job.yml -p DB_NAME=$(NEW_DB) -p BUILD_NAMESPACE=$(BUILD_NAMESPACE) -p JOB_NAME=$(JOB_NAME) | oc -n $(NAMESPACE) apply -f -

deploy-api:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	test -n "$(KEYCLOAK_REALM)"
	test -n "$(KEYCLOAK_CLIENT)"
	test -n "$(KEYCLOAK_AUTH_URL)"
	@echo "+\n++ Deploying API with tag: $(BUILD_TAG)\n+"
	@oc -n $(NAMESPACE) process -f openshift/api-deploy.yml -p NAME=$(API) -p HOST_NAME=$(HOST) -p DB_SERVICE=$(DB_SERVICE_NAME) -p BUILD_NAMESPACE=$(BUILD_NAMESPACE) -p IMAGE_STREAM_TAG="$(API):$(BUILD_TAG)" -p KEYCLOAK_REALM=$(KEYCLOAK_REALM) -p KEYCLOAK_CLIENT=$(KEYCLOAK_CLIENT) -p KEYCLOAK_AUTH_URL=$(KEYCLOAK_AUTH_URL) -p BUILD_TAG=$(BUILD_TAG) | oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,dc/$(API))

deploy-web:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	@echo "+\n++ Deploying Web with tag: $(BUILD_TAG)\n+"
	@oc -n $(NAMESPACE) process -f openshift/web-deploy.yml -p NAME=$(Web) -p HOST_NAME=$(HOST) -p BUILD_NAMESPACE=$(BUILD_NAMESPACE) -p IMAGE_STREAM_TAG="$(Web):$(BUILD_TAG)"  | oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,dc/$(Web))