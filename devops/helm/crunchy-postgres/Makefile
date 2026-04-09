SHELL := /usr/bin/env bash
NAME := crunchy

NAMESPACE=

ifndef NAMESPACE
$(error NAMESPACE is not set)
endif

define arguments
	"${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"
endef

POSTGRES_MANUAL_IMAGE_PATH=artifacts.developer.gov.bc.ca/bcgov-docker-local/crunchy-postgres

.PHONY: helm-dep
helm-dep:
	helm dependency update

.PHONY: install
install: helm-dep
install:
	@helm install $(call arguments) --set restore.enabled=false;

.PHONY: upgrade
upgrade: helm-dep
	@if [ "${RESTORE_ENABLED}" = "true" ]; then \
		if [ -z "${RESTORE_TARGET}" ]; then \
			echo "Error: RESTORE_TARGET is required when RESTORE_ENABLED is true."; \
			exit 1; \
		fi; \
		helm upgrade --install $(call arguments) --set restore.enabled=${RESTORE_ENABLED} --set restore.options.target="${RESTORE_TARGET}" --set restore.repoName="${RESTORE_REPO_NAME}"; \
		oc annotate -n ${NAMESPACE} postgrescluster simsdb --overwrite postgres-operator.crunchydata.com/pgbackrest-restore="${RESTORE_TARGET}"; \
	else \
		helm upgrade --install $(call arguments) --set restore.enabled=${RESTORE_ENABLED}; \
	fi
	
.PHONY: install-with-datasource
install-with-datasource:
	test -n "${DATASOURCE_S3_PATH_NAME}"
	test -n "${S3_ACCESS_KEY_ID}"
	test -n "${S3_SECRET_ACCESS_KEY}"
	@echo "Installing Crunchy Postgres with datasource enabled..."
	@echo "Datasource S3 path: ${DATASOURCE_S3_PATH_NAME}"
	@helm install $(call arguments) --set dataSource.enabled=true --set dataSource.s3Path="/${DATASOURCE_S3_PATH_NAME}" \
		--set pgBackRest.s3.s3Key="${S3_ACCESS_KEY_ID}" \
		--set pgBackRest.s3.s3KeySecret="${S3_SECRET_ACCESS_KEY}" \
		--set restore.enabled=false;

.PHONY: update-to-disable-datasource
update-to-disable-datasource:
	@helm upgrade --install $(call arguments) --set dataSource.enabled=false;

.PHONY: shutdown-cluster
shutdown-cluster:
	@oc patch postgrescluster simsdb -n ${NAMESPACE} --type=merge -p '{"spec":{"shutdown":true}}'

.PHONY: startup-cluster
startup-cluster:
	@oc patch postgrescluster simsdb -n ${NAMESPACE} --type=merge -p '{"spec":{"shutdown":false}}'

.PHONY: pg-upgrade
pg-upgrade:
	@echo "Initiating PostgreSQL upgrade from ${FROM_VERSION} to ${TO_VERSION}..."
	@echo "Postgres image tag provided: $(or $(POSTGRES_IMAGE_TAG),None)"
	@helm upgrade --install $(call arguments) \
		--set pgUpgrade.fromPostgresVersion="${FROM_VERSION}" \
		--set pgUpgrade.toPostgresVersion="${TO_VERSION}" \
		--set pgUpgrade.enabled=true \
		--set restore.enabled=false
	@oc -n ${NAMESPACE} annotate postgrescluster simsdb postgres-operator.crunchydata.com/allow-upgrade="postgres-version-upgrade"
	@echo "Upgrade submitted. Monitor the upgrade progress with:"
	@echo "@oc get pgupgrade -n ${NAMESPACE}"
	@echo "@oc describe pgupgrade postgres-version-upgrade -n ${NAMESPACE}"
	@echo "Waiting for PGClusterNotShutdown status..."
	@oc -n ${NAMESPACE} wait pgupgrade/postgres-version-upgrade --for=condition=Progressing=false -n ${NAMESPACE} --timeout=300s
	@echo "Shutting down PostgreSQL cluster for upgrade..."
	@oc patch postgrescluster simsdb -n ${NAMESPACE} --type=merge -p '{"spec":{"shutdown":true}}'
	@echo "Waiting for upgrade to progress..."
	@oc -n ${NAMESPACE} wait pgupgrade/postgres-version-upgrade --for=condition=Progressing=true -n ${NAMESPACE} --timeout=1800s
	@echo "PostgreSQL upgrade is now in progress..."
	@echo "Waiting for PostgreSQL upgrade to complete..."
	@oc -n ${NAMESPACE} wait pgupgrade/postgres-version-upgrade --for=condition=Succeeded=true -n ${NAMESPACE} --timeout=1800s
	@echo "PostgreSQL upgrade from ${FROM_VERSION} to ${TO_VERSION} completed successfully!"
	@echo "Removing the upgrade annotation from the PostgreSQL cluster..."
	@oc -n ${NAMESPACE} annotate postgrescluster simsdb postgres-operator.crunchydata.com/allow-upgrade- --overwrite
	@echo "Disabling pgUpgrade to prevent future upgrades during helm upgrades..."
	@helm upgrade --install $(call arguments) \
		--set pgUpgrade.enabled=false \
		--set restore.enabled=false \
		--set postgresVersion="${TO_VERSION}"
	@echo "pgUpgrade.enabled has been set to false."
	@echo "Starting the PostgreSQL cluster..."
	@if [ -n "${POSTGRES_IMAGE_TAG}" ]; then \
		PATCH_CONFIG="{\"spec\":{\"postgresVersion\":${TO_VERSION}, \"shutdown\":false, \"image\":\"${POSTGRES_MANUAL_IMAGE_PATH}:${POSTGRES_IMAGE_TAG}\"}}"; \
	else \
		PATCH_CONFIG="{\"spec\":{\"postgresVersion\":${TO_VERSION}, \"shutdown\":false}}"; \
	fi; \
	oc patch postgrescluster simsdb -n ${NAMESPACE} --type=merge -p "$$PATCH_CONFIG"
	@echo "PostgreSQL cluster upgrade complete and restart initiated."

# Uninstall is used to completely remove the helm and its installed object from the openshift environment.
# .PHONY: uninstall
# uninstall: helm-dep
# 	@helm uninstall ${NAME} -n ${NAMESPACE}

.PHONY: template
template: helm-dep
template:
	@helm template . -f values.yaml > template.yaml

.PHONY: force-install
force-install: uninstall
force-install: install
