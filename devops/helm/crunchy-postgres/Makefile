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
upgrade:
	@helm upgrade --install ${NAME} . -n ${NAMESPACE} -f values.yaml

.PHONY: uninstall
uninstall: helm-dep
uninstall:
	@helm uninstall ${NAME} . -n ${NAMESPACE}

.PHONY: template
template: helm-dep
template:
	@helm template ${NAME} -n ${NAMESPACE} -f values.yaml > template.yaml

.PHONY: force-install
force-install: uninstall
force-install: install
