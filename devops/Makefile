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
export SITE_MINDER_LOGOUT_URL := $(or $(SITE_MINDER_LOGOUT_URL), https://logontest.gov.bc.ca/clp-cgi/logoff.cgi)

define BUILD_TAG
"$(BUILD_REF)-${BUILD_ID}"
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

define HAMONGO_DB_TEMPLATE_PATH
"openshift/forms-flow-ai/database/mongo-ha.yml"
endef

define HAMONGO_DB_PARAM_PATH
"openshift/forms-flow-ai/database/mongo-ha-param.yml"
endef

define FORM_AI_BUILD_TEMPLATE_PATH
"openshift/forms-flow-ai/build.yml"
endef

define FORM_AI_FORMS_DEPLOY_TEMPLATE_PATH
"openshift/forms-flow-ai/forms-deploy.yml"
endef

define FORMIO_FORMS_NAME
"forms-flow-forms"
endef

define FORMIO_BPM_NAME
"forms-flow-bpm"
endef

define FORMIO_API_NAME
"forms-flow-api"
endef

define FORMIO_WEB_NAME
"forms-flow-web"
endef

define FORMIO_SOURCE_REPO_URL
"https://github.com/AOT-Technologies/forms-flow-ai.git"
endef

define FORMIO_SOURCE_REPO_BRANCH
"master"
endef

define SOURCE_REPOSITORY_REF
"157CICD"
endef

define SOURCE_CONTEXT_DIR
"devops/forms-flow-ai/"
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
oc-build-forms-flow-forms: | print-status build-forms-flow-forms
oc-deploy-forms-flow-forms: | print-status deploy-forms-flow-forms
oc-build-forms-flow-bpm: | print-status build-forms-flow-bpm
oc-deploy-forms-flow-bpm: | print-status deploy-forms-flow-bpm
oc-build-forms-flow-api: | print-status build-forms-flow-api
oc-deploy-forms-flow-api: | print-status deploy-forms-flow-api
oc-build-forms-flow-web: | print-status build-forms-flow-web
oc-deploy-forms-flow-web: | print-status deploy-forms-flow-web
oc-deploy-ha-mongo: | print-status deploy-ha-mongo

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
	test -n $(API_INIT_WORKFLOW_SA_USER_NAME)
	test -n $(API_INIT_WORKFLOW_SA_PASSWORD)
	test -n $(API_INIT_SIMS_API_CLIENT_ID)
	test -n $(API_INIT_SIMS_API_CLIENT_SECRET)
	test -n $(API_INIT_CRA_REQUEST_FOLDER)
	test -n $(API_INIT_CRA_RESPONSE_FOLDER)
	test -n $(API_INIT_CRA_PROGRAM_AREA_CODE)
	test -n $(API_INIT_CRA_ENVIRONMENT_CODE)
	@oc -n $(NAMESPACE) process -f openshift/api-pre-req.yml \
		-p NAME=api -p BCeID_WEB_SERVICE_ONLINE_SERVICE_ID=$(API_INIT_BCeID_WEB_SERVICE_ONLINE_SERVICE_ID) \
		-p BCeID_WEB_SERVICE_REQUESTER_USER_GUID=$(API_INIT_BCeID_WEB_SERVICE_REQUESTER_USER_GUID) \
		-p BCeID_WEB_SERVICE_AUTH_USER_NAME=$(API_INIT_BCeID_WEB_SERVICE_AUTH_USER_NAME) \
		-p BCeID_WEB_SERVICE_AUTH_USER_PASSWORD=$(API_INIT_REQ_BCeID_WEB_SERVICE_AUTH_USER_PASSWORD) \
		-p WORKFLOW_SA_USER_NAME=$(API_INIT_WORKFLOW_SA_USER_NAME) \
		-p WORKFLOW_SA_PASSWORD=$(API_INIT_WORKFLOW_SA_PASSWORD) \
		-p FORMS_SA_USER_NAME=$(API_INIT_FORMS_SA_USER_NAME) \
		-p FORMS_SA_PASSWORD=$(API_INIT_FORMS_SA_PASSWORD) \
		-p SIMS_API_CLIENT_ID=$(API_INIT_SIMS_API_CLIENT_ID) \
		-p SIMS_API_CLIENT_SECRET=$(API_INIT_SIMS_API_CLIENT_SECRET) \
		-p CRA_REQUEST_FOLDER=$(API_INIT_CRA_REQUEST_FOLDER) \
		-p CRA_RESPONSE_FOLDER=$(API_INIT_CRA_RESPONSE_FOLDER) \
		-p CRA_PROGRAM_AREA_CODE=$(API_INIT_CRA_PROGRAM_AREA_CODE) \
		-p CRA_ENVIRONMENT_CODE=$(API_INIT_CRA_ENVIRONMENT_CODE) \
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
	test -n "$(KEYCLOAK_CLIENT_STUDENT)"
	test -n "$(KEYCLOAK_CLIENT_INSTITUTION)"
	test -n "$(KEYCLOAK_AUTH_URL)"
	test -n "$(BCeID_WEB_SERVICE_WSDL)"
	test -n "$(RULE_ENGINE_URL)"
	test -n "$(FORMS_URL)"
	test -n "$(SITE_MINDER_LOGOUT_URL)"
	test -n "$(FORMS_FLOW_API_URL)"
	@echo "+\n++ Deploying API with tag: $(BUILD_TAG)\n+"
	@oc -n $(NAMESPACE) process -f openshift/api-deploy.yml -p NAME=$(API) -p HOST_NAME=$(HOST) -p DB_SERVICE=$(DB_SERVICE_NAME) -p BUILD_NAMESPACE=$(BUILD_NAMESPACE) -p IMAGE_STREAM_TAG="$(API):$(BUILD_TAG)" -p KEYCLOAK_REALM=$(KEYCLOAK_REALM) -p KEYCLOAK_CLIENT_STUDENT=$(KEYCLOAK_CLIENT_STUDENT) -p KEYCLOAK_CLIENT_INSTITUTION=$(KEYCLOAK_CLIENT_INSTITUTION) -p KEYCLOAK_AUTH_URL=$(KEYCLOAK_AUTH_URL) -p BCeID_WEB_SERVICE_WSDL=$(BCeID_WEB_SERVICE_WSDL) -p RULE_ENGINE_URL=$(RULE_ENGINE_URL) -p FORMS_URL=$(FORMS_URL) -p BUILD_TAG=$(BUILD_TAG) -p SITE_MINDER_LOGOUT_URL=$(SITE_MINDER_LOGOUT_URL) -p FORMS_FLOW_API_URL=$(FORMS_FLOW_API_URL) | oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,dc/$(API))

deploy-web:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	@echo "+\n++ Deploying Web with tag: $(BUILD_TAG)\n+"
	@oc -n $(NAMESPACE) process -f openshift/web-deploy.yml -p NAME=$(Web) -p HOST_NAME=$(HOST) -p BUILD_NAMESPACE=$(BUILD_NAMESPACE) -p IMAGE_STREAM_TAG="$(Web):$(BUILD_TAG)"  | oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,dc/$(Web))

deploy-ha-mongo:
	test -n "$(NAMESPACE)"
	@oc -n $(NAMESPACE) process -f $(HAMONGO_DB_TEMPLATE_PATH) --param-file==$(HAMONGO_DB_PARAM_PATH) | oc -n $(NAMESPACE) apply -f -

build-forms-flow-forms:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(FORMIO_FORMS_NAME)"
	test -n "$(SOURCE_REPOSITORY_REF)"
	test -n "$(BUILD_TAG)"
	test -n "$(SOURCE_CONTEXT_DIR)"
	test -n "$(FORM_AI_BUILD_TEMPLATE_PATH)"
	@echo "+\n++ BUILDING ${FORMIO_FORMS_NAME}"
	@echo "+\n++ BUILDING ${FORMIO_FORMS_NAME} DIR: $(SOURCE_CONTEXT_DIR)$(FORMIO_FORMS_NAME) BuildFile:$(FORM_AI_BUILD_TEMPLATE_PATH) BUILD_TAG:$(BUILD_TAG)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(FORM_AI_BUILD_TEMPLATE_PATH) -p NAME=$(FORMIO_FORMS_NAME) -p TAG=$(BUILD_TAG) -p FORMIO_SOURCE_REPO_URL=$(FORMIO_SOURCE_REPO_URL) -p FORMIO_SOURCE_REPO_BRANCH=$(FORMIO_SOURCE_REPO_BRANCH) -p SOURCE_REPOSITORY_REF=$(SOURCE_REPOSITORY_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)$(FORMIO_FORMS_NAME)| oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(FORMIO_FORMS_NAME) --wait

deploy-forms-flow-forms:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BUILD_REF)"
	@echo "+\n++ Deploying forms-flow-forms with tag: $(BUILD_TAG)\n+"
	@oc -n $(NAMESPACE) process -f ${FORM_AI_FORMS_DEPLOY_TEMPLATE_PATH} -p NAME=$(FORMIO_FORMS_NAME) -p FFA_FORMS_URL="dev-aest-ffa-forms.apps.silver.devops.gov.bc.ca" | oc -n $(NAMESPACE) apply -f -
	$(call rollout_and_wait,dc/$(FORMIO_FORMS_NAME))

build-forms-flow-bpm:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(FORMIO_BPM_NAME)"
	test -n "$(SOURCE_REPOSITORY_REF)"
	test -n "$(SOURCE_CONTEXT_DIR)"
	test -n "$(FORM_AI_BUILD_TEMPLATE_PATH)"
	@echo "+\n++ BUILDING ${FORMIO_BPM_NAME}"
	@echo "+\n++ BUILDING ${FORMIO_BPM_NAME} DIR: $(SOURCE_CONTEXT_DIR)$(FORMIO_BPM_NAME) BuildFile:$(FORM_AI_BUILD_TEMPLATE_PATH)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(FORM_AI_BUILD_TEMPLATE_PATH) -p NAME=$(FORMIO_BPM_NAME) -p TAG=$(BUILD_TAG) -p FORMIO_SOURCE_REPO_URL=$(FORMIO_SOURCE_REPO_URL) -p FORMIO_SOURCE_REPO_BRANCH=$(FORMIO_SOURCE_REPO_BRANCH) -p SOURCE_REPOSITORY_REF=$(SOURCE_REPOSITORY_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)$(FORMIO_BPM_NAME)| oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(FORMIO_BPM_NAME) --wait

build-forms-flow-api:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(FORMIO_API_NAME)"
	test -n "$(SOURCE_REPOSITORY_REF)"
	test -n "$(SOURCE_CONTEXT_DIR)"
	test -n "$(FORM_AI_BUILD_TEMPLATE_PATH)"
	@echo "+\n++ BUILDING ${FORMIO_API_NAME}"
	@echo "+\n++ BUILDING ${FORMIO_API_NAME} DIR: $(SOURCE_CONTEXT_DIR)$(FORMIO_API_NAME) BuildFile:$(FORM_AI_BUILD_TEMPLATE_PATH)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(FORM_AI_BUILD_TEMPLATE_PATH) -p NAME=$(FORMIO_API_NAME) -p TAG=$(BUILD_TAG) -p FORMIO_SOURCE_REPO_URL=$(FORMIO_SOURCE_REPO_URL) -p FORMIO_SOURCE_REPO_BRANCH=$(FORMIO_SOURCE_REPO_BRANCH) -p SOURCE_REPOSITORY_REF=$(SOURCE_REPOSITORY_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)$(FORMIO_API_NAME)| oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(FORMIO_API_NAME) --wait

build-forms-flow-web:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(FORMIO_WEB_NAME)"
	test -n "$(SOURCE_REPOSITORY_REF)"
	test -n "$(SOURCE_CONTEXT_DIR)"
	test -n "$(FORM_AI_BUILD_TEMPLATE_PATH)"
	@echo "+\n++ BUILDING ${FORMIO_WEB_NAME}"
	@echo "+\n++ BUILDING ${FORMIO_WEB_NAME} DIR: $(SOURCE_CONTEXT_DIR)$(FORMIO_WEB_NAME) BuildFile:$(FORM_AI_BUILD_TEMPLATE_PATH)\n+"
	@oc -n $(BUILD_NAMESPACE) process -f $(FORM_AI_BUILD_TEMPLATE_PATH) -p NAME=$(FORMIO_WEB_NAME) -p TAG=$(BUILD_TAG) -p FORMIO_SOURCE_REPO_URL=$(FORMIO_SOURCE_REPO_URL) -p FORMIO_SOURCE_REPO_BRANCH=$(FORMIO_SOURCE_REPO_BRANCH) -p SOURCE_REPOSITORY_REF=$(SOURCE_REPOSITORY_REF) -p SOURCE_CONTEXT_DIR=$(SOURCE_CONTEXT_DIR)$(FORMIO_WEB_NAME)| oc -n $(BUILD_NAMESPACE) apply -f -
	@oc -n $(BUILD_NAMESPACE) start-build bc/$(FORMIO_WEB_NAME) --wait