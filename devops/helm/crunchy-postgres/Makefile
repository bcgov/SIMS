SHELL := /usr/bin/env bash
NAME := crunchy

NAMESPACE=

ifndef NAMESPACE
$(error NAMESPACE is not set)
endif

.PHONY: helm-dep
helm-dep:
	helm dependency update

.PHONY: install
install: helm-dep
install:
	@helm install ${NAME} . -n ${NAMESPACE} -f values.yaml

.PHONY: upgrade
upgrade: helm-dep
	@if [ "${RESTORE_ENABLED}" = "true" ]; then \
		if [ -z "${RESTORE_TARGET}" ]; then \
			echo "Error: RESTORE_TARGET is required when RESTORE_ENABLED is true."; \
			exit 1; \
		fi; \
		helm upgrade --install ${NAME} . -n ${NAMESPACE} --set restore.enabled=true --set restore.options.target="${RESTORE_TARGET}" -f values.yaml; \
	else \
		helm upgrade --install ${NAME} . -n ${NAMESPACE} --set restore.enabled=false -f values.yaml; \
	fi

.PHONY: uninstall
uninstall: helm-dep
uninstall:
	@helm uninstall ${NAME} . -n ${NAMESPACE}

.PHONY: template
template: helm-dep
template:
	@helm template . -f values.yaml > template.yaml

.PHONY: force-install
force-install: uninstall
force-install: install
