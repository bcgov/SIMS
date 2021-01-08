-include ../.env

export $(shell sed 's/=.*//' ../.env)
export GIT_LOCAL_BRANCH?=$(shell git rev-parse --abbrev-ref HEAD)
export PROJECT_NAME := $(or $(PROJECT_NAME), aest-sims)
export BUILD_REF :=  $(or $(GIT_LOCAL_BRANCH), dev)
export BUILD_ID := $(or $(BUILD_ID), 0)
export API_PORT := $(or $(API_PORT), 3000)
export APP_PORT := $(or $(APP_PORT), 8080)
export POSTGRES_PORT := $(or $(POSTGRES_PORT), 5432)
export POSTGRES_USER := $(or $(POSTGRES_USER), admin)
export POSTGRES_PASSWORD := $(or $(POSTGRES_PASSWORD), aest_sim)
export POSTGRES_DB := $(or $(POSTGRES_DB), aest)

local:	| print-status local-build-run
db: | print-status postgres

####################################################################
## Status Output
####################################################################

print-status:
	@echo " +---------------------------------------------------------+ "
	@echo " | Current Settings                                        | "
	@echo " +---------------------------------------------------------+ "
	@echo " | BUILD_TAG: $(BUILD_TAG) "
	@echo " | PROJECT: $(PROJECT_NAME) "
	@echo " | API_PORT: $(API_PORT) "
	@echo " | APP_PORT: $(APP_PORT) "
	@echo " | POSTGRES_PORT: $(POSTGRES_PORT) "
	@echo " | POSTGRES_DB: $(POSTGRES_DB) "
	@echo " | POSTGRES_USER: $(POSTGRES_USER) "
	@echo " | POSTGRES_PASSWORD: $(POSTGRES_PASSWORD) "
	@echo " +---------------------------------------------------------+ "

#################################################################
## Local Build/Run 
#################################################################

# Build locally
local-build:
	@echo "+\n++ Make: Building locally ...\n+"
	@docker-compose -f docker-compose.yml build

# Run locally
local-run:
	@echo "+\n++ Make: Run locally ...\n+"
	@docker-compose -f docker-compose.yml up

# Build and run locally
local-build-run:
	@echo "+\n++ Make: Build / Run locally ...\n+"
	@docker-compose -f docker-compose.yml up --build

# Stop locally
local-stop:
	@echo "+\n++ Make: Stop local app ...\n+"
	@docker-compose -f docker-compose.yml down

# Clean locally
local-clean:
	@echo "+\n++ Make: Clean local app ...\n+"
	@docker-compose -f docker-compose.yml down -v

# Local DB
postgres:
	@echo "+\n++ Make: Run local db.\n+"
	@docker-compose -f docker-compose.yml up postgres

