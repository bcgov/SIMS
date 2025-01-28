SHELL := /usr/bin/env bash
NAME := redis-cluster

NAMESPACE=

ifndef NAMESPACE
$(error NAMESPACE is not set)
endif

define arguments
	"${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"
endef

.PHONY: helm-dep
helm-dep:
	@helm dependency update

.PHONY: install
install: helm-dep
install:
	@helm install $(call arguments);

.PHONY: upgrade
upgrade: helm-dep
	@helm upgrade $(call arguments) --set password=${PASSWORD};

# Uninstall is used to completely remove the helm and its installed object from the openshift environment.
.PHONY: uninstall
uninstall: helm-dep
uninstall:
	@helm uninstall ${NAME} . -n ${NAMESPACE}

.PHONY: template
template: helm-dep
template:
	@helm template $(call arguments) > template.yaml

.PHONY: force-install
force-install: uninstall
force-install: install
