SHELL := /usr/bin/env bash
NAME := crunchy

NAMESPACE=

ifndef NAMESPACE
$(error NAMESPACE is not set)
endif

define arguments
	"${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"
endef

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
		helm upgrade --install $(call arguments) --set restore.enabled=${RESTORE_ENABLED} --set restore.options.target="${RESTORE_TARGET}"; \
	else \
		helm upgrade --install $(call arguments) --set restore.enabled=${RESTORE_ENABLED}; \
	fi

# Uninstall is used to completely remove the helm and its installed object from the openshift environment.
#.PHONY: uninstall
#uninstall: helm-dep
#uninstall:
#	@helm uninstall ${NAME} . -n ${NAMESPACE}

.PHONY: template
template: helm-dep
template:
	@helm template . -f values.yaml > template.yaml

.PHONY: force-install
force-install: uninstall
force-install: install
