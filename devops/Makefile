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
export BACKUP_POSTGRESQL_APP_NAME := $(or $(BACKUP_POSTGRESQL_APP_NAME), postgresql-backup)
export BACKUP_MONGODB_APP_NAME := $(or $(BACKUP_MONGODB_APP_NAME), mongodb-backup)
export BACKUP_CONFIGMAP_NAME := $(or $(BACKUP_CONFIGMAP_NAME), backup-conf)

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
# Create/delete backup structure
# Create/delete config map shared accross postgresql and mongodb.
oc-db-backup-configmap-init: | print-status db-backup-configmap
oc-db-backup-configmap-delete: | print-status db-backup-configmap-delete
# Create/delete structire for postgresql.
oc-db-backup-init-postgresql: | print-status db-backup-build-postgresql db-backup-deploy-postgresql
oc-db-backup-delete-postgresql: | print-status db-backup-build-delete-postgresql db-backup-deploy-delete-postgresql
# Create/delete structire for mongodb.
oc-db-backup-init-mongodb: | print-status db-backup-build-mongodb db-backup-deploy-mongodb
oc-db-backup-delete-mongodb: | print-status db-backup-build-delete-mongodb db-backup-deploy-delete-mongodb

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

# Create database backup structure (build/configmap/deploy)

# Create the config map to be shared by POSTGRES and mongodb.
db-backup-configmap:
	test -n "$(NAMESPACE)"
	test -n "$(BACKUP_POSTGRESQL_APP_NAME)"
	test -n "$(BACKUP_MONGODB_APP_NAME)"
	@echo "+\n++ Creating configmap resources for database backups on $(NAMESPACE)\n+"
	oc -n $(NAMESPACE) create configmap $(BACKUP_CONFIGMAP_NAME) --from-file=./openshift/database-backup/backup.conf

db-backup-configmap-delete:
	test -n "$(NAMESPACE)"
	@echo "+\n++ Removing configmap resoures for database backups on $(NAMESPACE)\n+"
	oc -n $(NAMESPACE) delete configmap/$(BACKUP_CONFIGMAP_NAME)

# Create the POSTGRES structure
db-backup-build-postgresql:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BACKUP_POSTGRESQL_APP_NAME)"
	@echo "+\n++ Creating build resources for database backups on $(BUILD_NAMESPACE)\n+"
	oc -n $(BUILD_NAMESPACE) process -f ./openshift/database-backup/backup-build.yaml \
		-p NAME=$(BACKUP_POSTGRESQL_APP_NAME) OUTPUT_IMAGE_TAG=v1 \
		-p BASE_IMAGE_FOR_BUILD=artifacts.developer.gov.bc.ca/docker-remote/centos/postgresql-12-centos7:20200917-804ef01 \
		| oc -n $(BUILD_NAMESPACE) apply -f -

db-backup-build-delete-postgresql:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BACKUP_POSTGRESQL_APP_NAME)"
	@echo "+\n++ Removing build resoures for database backups on $(NAMESPACE)\n+"
	oc -n $(BUILD_NAMESPACE) delete is/$(BACKUP_POSTGRESQL_APP_NAME) bc/$(BACKUP_POSTGRESQL_APP_NAME)

db-backup-deploy-postgresql:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BACKUP_POSTGRESQL_APP_NAME)"
	@echo "+\n++ Creating deploy config resoures for database backups on $(NAMESPACE)\n+"
	oc -n $(NAMESPACE) process -f ./openshift/database-backup/backup-deploy.yaml \
  	-p NAME=$(BACKUP_POSTGRESQL_APP_NAME) \
  	-p IMAGE_NAMESPACE=$(BUILD_NAMESPACE) \
  	-p SOURCE_IMAGE_NAME=$(BACKUP_POSTGRESQL_APP_NAME) \
  	-p TAG_NAME=v1 \
		-p FTP_SECRET_KEY=$(BACKUP_POSTGRESQL_APP_NAME)-ftp-secret \
  	-p BACKUP_VOLUME_NAME=$(BACKUP_POSTGRESQL_APP_NAME)-pvc \
		-p BACKUP_VOLUME_SIZE=20Gi \
  	-p VERIFICATION_VOLUME_SIZE=5Gi \
  	-p ENVIRONMENT_NAME=$(NAMESPACE) \
		-p CONFIG_MAP_NAME=$(BACKUP_CONFIGMAP_NAME) \
		-p VERIFICATION_VOLUME_NAME=$(BACKUP_POSTGRESQL_APP_NAME)-verification-pvc \
		-p DATABASE_SERVER_NAME=PATRONI_MASTER \
		-p DATABASE_SECRET_NAME=patroni-creds \
		-p DATABASE_SECRET_USER_KEY_NAME=superuser-username \
		-p DATABASE_SECRET_PASSWORD_KEY_NAME=superuser-password \
  	-p ENVIRONMENT_FRIENDLY_NAME='SIMS $(NAMESPACE) POSTGRESQL DB Backups' \
		| oc -n $(NAMESPACE) apply -f -	                                                                       

db-backup-deploy-delete-postgresql:
	test -n "$(NAMESPACE)"
	test -n "$(BACKUP_POSTGRESQL_APP_NAME)"
	@echo "+\n++ Removing deploy resoures for database backups on $(NAMESPACE)\n+"
	oc -n $(NAMESPACE) delete \
  	secret/$(BACKUP_POSTGRESQL_APP_NAME) \
  	secret/$(BACKUP_POSTGRESQL_APP_NAME)-ftp-secret \
  	dc/$(BACKUP_POSTGRESQL_APP_NAME) \
  	networkpolicy/$(BACKUP_POSTGRESQL_APP_NAME)
# The below PVCs are not deleted.
# pvc/$(BACKUP_POSTGRESQL_APP_NAME)-pvc \
# pvc/$(BACKUP_POSTGRESQL_APP_NAME)-verification-pvc \
	
# Create the MONGODB structure
db-backup-build-mongodb:
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BACKUP_MONGODB_APP_NAME)"
	@echo "+\n++ Creating build resources for database backups on $(BUILD_NAMESPACE)\n+"
	oc -n $(BUILD_NAMESPACE) process -f ./openshift/database-backup/backup-build.yaml \
		-p NAME=$(BACKUP_MONGODB_APP_NAME) OUTPUT_IMAGE_TAG=v1 \
		-p BASE_IMAGE_FOR_BUILD=artifacts.developer.gov.bc.ca/redhat-docker-remote/rhscl/mongodb-36-rhel7 \
		| oc -n $(BUILD_NAMESPACE) apply -f -

db-backup-build-delete-mongodb:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BACKUP_MONGODB_APP_NAME)"
	@echo "+\n++ Removing build resoures for database backups on $(NAMESPACE)\n+"
	oc -n $(BUILD_NAMESPACE) delete is/$(BACKUP_MONGODB_APP_NAME) bc/$(BACKUP_MONGODB_APP_NAME)

db-backup-deploy-mongodb:
	test -n "$(NAMESPACE)"
	test -n "$(BUILD_NAMESPACE)"
	test -n "$(BACKUP_MONGODB_APP_NAME)"
	@echo "+\n++ Creating deploy config resoures for database backups on $(NAMESPACE)\n+"
	oc -n $(NAMESPACE) process -f ./openshift/database-backup/backup-deploy.yaml \
  	-p NAME=$(BACKUP_MONGODB_APP_NAME) \
  	-p IMAGE_NAMESPACE=$(BUILD_NAMESPACE) \
  	-p SOURCE_IMAGE_NAME=$(BACKUP_MONGODB_APP_NAME) \
  	-p TAG_NAME=v1 \
		-p FTP_SECRET_KEY=$(BACKUP_MONGODB_APP_NAME)-ftp-secret \
  	-p BACKUP_VOLUME_NAME=$(BACKUP_MONGODB_APP_NAME)-pvc \
		-p BACKUP_VOLUME_SIZE=5Gi \
  	-p VERIFICATION_VOLUME_SIZE=1Gi \
  	-p ENVIRONMENT_NAME=$(NAMESPACE) \
		-p CONFIG_MAP_NAME=$(BACKUP_CONFIGMAP_NAME) \
		-p VERIFICATION_VOLUME_NAME=$(BACKUP_MONGODB_APP_NAME)-verification-pvc \
		-p DATABASE_SERVER_NAME=MONGO \
		-p DATABASE_SECRET_NAME=mongodb-creds \
		-p DATABASE_SECRET_USER_KEY_NAME=username \
		-p DATABASE_SECRET_PASSWORD_KEY_NAME=password \
  	-p ENVIRONMENT_FRIENDLY_NAME='SIMS $(NAMESPACE) MONGO DB Backups' \
		| oc -n $(NAMESPACE) apply -f -

db-backup-deploy-delete-mongodb:
	test -n "$(NAMESPACE)"
	test -n "$(BACKUP_MONGODB_APP_NAME)"
	@echo "+\n++ Removing deploy resoures for database backups on $(NAMESPACE)\n+"
	oc -n $(NAMESPACE) delete \
  	secret/$(BACKUP_MONGODB_APP_NAME) \
  	secret/$(BACKUP_MONGODB_APP_NAME)-ftp-secret \
  	dc/$(BACKUP_MONGODB_APP_NAME) \
  	networkpolicy/$(BACKUP_MONGODB_APP_NAME)
# The below PVCs are not deleted.
# pvc/$(BACKUP_MONGODB_APP_NAME)-pvc
# pvc/$(BACKUP_MONGODB_APP_NAME)-verification-pvc