SHELL := /usr/bin/env bash
NAME := clamav

NAMESPACE=
IMAGE_TAG=

ifndef NAMESPACE
$(error NAMESPACE is not set)
endif

ifndef IMAGE_TAG
$(error IMAGE_TAG is not set)
endif

define arguments
	"${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml" \
	--set clamav.image.tag="${IMAGE_TAG}"
endef

.PHONY: helm-dep
helm-dep:
	helm dependency update

.PHONY: install
install: helm-dep
install:
	@helm install $(call arguments)

.PHONY: upgrade
upgrade: helm-dep
upgrade:
	@helm upgrade --install $(call arguments)

.PHONY: lint
lint: helm-dep
lint:
	@helm upgrade --dry-run --install $(call arguments)

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
