SHELL := /usr/bin/env bash
NAME := mongodb

NAMESPACE=
FORMS_USER=
FORMS_PASSWORD=

ifndef NAMESPACE
$(error NAMESPACE is not set)
endif

.PHONY: check-args-defined
check-args-defined:
ifndef FORMS_USER
	$(error FORMS_USER is not set)
endif
ifndef FORMS_PASSWORD
	$(error FORMS_PASSWORD is not set)
endif

define arguments
	"${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml" \
	--set auth.usernames={"${FORMS_USER}"} \
	--set-string auth.passwords={"${FORMS_PASSWORD}"} \
	--set-string auth.databases={"forms"}
endef

.PHONY: helm-dep
helm-dep:
	@helm dependency update

.PHONY: install
install: check-args-defined helm-dep
install:
	@helm install $(call arguments)
	

.PHONY: upgrade
upgrade: check-args-defined helm-dep
	@helm upgrade --install $(call arguments)

# Uninstall is used to completely remove the helm and its installed object from the openshift environment.
.PHONY: uninstall
uninstall: helm-dep
uninstall:
	@helm uninstall ${NAME} -n ${NAMESPACE}

.PHONY: template
template: helm-dep
template:
	@helm template $(call arguments) > template.yaml

.PHONY: force-install
force-install: uninstall
force-install: install
