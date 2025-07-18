SHELL := /usr/bin/env bash
NAME := mongodb

# --- Chart Management ---
# This Makefile uses a pre-downloaded chart package. To manage the chart:
#
# 1. Add the Bitnami repo (one-time setup):
#    helm repo add bitnami https://charts.bitnami.com/bitnami
#
# 2. Find available chart versions:
#    helm search repo bitnami/mongodb --versions
#
# 3. Download a specific version (e.g., 16.6.2):
#    helm pull bitnami/mongodb --version 16.6.2
#
# 4. After downloading, update the CHART_PACKAGE variable below.
CHART_PACKAGE=mongodb-16.5.32.tgz
NAMESPACE=
FORMS_DB_USER=
FORMS_DB_PASSWORD=

ifndef NAMESPACE
$(error NAMESPACE is not set)
endif

.PHONY: check-args-defined
check-args-defined:
ifndef FORMS_DB_USER
	$(error FORMS_DB_USER is not set)
endif
ifndef FORMS_DB_PASSWORD
	$(error FORMS_DB_PASSWORD is not set)
endif

define arguments
	"${NAME}" ${CHART_PACKAGE} -n "${NAMESPACE}" -f "values-${NAMESPACE}.yaml" \
	--set auth.usernames={"${FORMS_DB_USER}"} \
	--set-string auth.passwords={"${FORMS_DB_PASSWORD}"} \
	--set-string auth.databases={"forms"}
endef

# Install the helm chart if not present, otherwise, updates it.
.PHONY: upgrade
upgrade: check-args-defined
	@helm upgrade --install $(call arguments)

# Uninstall is used to completely remove the helm and its installed object from the openshift environment.
.PHONY: uninstall
uninstall:
	@helm uninstall ${NAME} -n ${NAMESPACE}