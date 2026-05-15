#Formio forms integration
export FORMIO_SOURCE_REPO_URL := $(or ${FORMIO_SOURCE_REPO_URL}, https://github.com/formio/formio.git)
# Form.io version targeting the API Server Version 9.7.7
# see https://github.com/formio/enterprise-release/blob/master/API-Server-Change-Log.md#api-server-version-977
export FORMIO_SOURCE_REPO_REF := $(or $(FORMIO_SOURCE_REPO_REF), f92dc5feab5cd0ff3ee30965141f11a8e552fe51)
export FORMIO_CORE_VERSION := $(or $(FORMIO_CORE_VERSION), 2.6.5)
export FORMIO_JS_VERSION := $(or $(FORMIO_JS_VERSION), 5.3.5)
export FORMIO_VM_VERSION := $(or $(FORMIO_VM_VERSION), 2.0.2)